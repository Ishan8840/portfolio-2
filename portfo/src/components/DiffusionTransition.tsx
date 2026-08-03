import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Location } from "react-router-dom";
import {
  extractParticles,
  rasterize,
  warmPosters,
  type Particles,
} from "../lib/rasterize";

/**
 * Page transition modelled on diffusion, over the page's real pixels.
 *
 * Both pages are rasterised to an offscreen canvas, so the particle field starts
 * as an exact copy of the page you're leaving — real glyphs, real screenshots,
 * real colours — scatters into noise, then resolves into an exact copy of the
 * page you're arriving at before handing back to the live DOM.
 *
 * Tens of thousands of particles are far past what per-particle canvas calls can
 * sustain, so frames are composed by writing into an ImageData buffer and
 * blitting once.
 */

const DISSOLVE_MS = 520;
const NOISE_MS = 220;
const REFORM_MS = 620;

/** The field renders below CSS resolution: clearing and blitting a full-size
 *  buffer every frame dominated cost, and upscaled square pixels suit the look. */
const SCALE = 0.75;
/**
 * Peak displacement of a particle from where it started, in raster pixels.
 * Diffusion adds noise in place — the image degrades where it stands — so each
 * particle wanders a short random direction rather than being flung across the
 * viewport and hauled back.
 */
const JITTER_MIN = 14;
const JITTER_MAX = 58;
/** Side of the buckets used to hand each particle a nearby destination. */
const CELL = 22;
/**
 * Peak per-channel colour noise. Kept low on purpose: at high values the field
 * stops looking like this page coming apart and starts looking like unrelated
 * colour static.
 */
const COLOR_NOISE = 16;
/**
 * Fixed particle count for every page. Deriving it from whatever page you
 * started on made transitions out of sparse pages look nearly empty.
 */
const PARTICLES = 90000;
/** Fraction of each phase over which particle start times are spread. */
const STAGGER = 0.4;
/**
 * Swap the DOM early in the dissolve. The outgoing page has already been
 * captured into particles and the live DOM is faded out by then, so mounting the
 * next route plus rasterising it — the two most expensive steps — finish well
 * before reassembly starts instead of stalling its first frames.
 */
const SWAP_AT = DISSOLVE_MS * 0.45;

type Phase = "idle" | "dissolve" | "noise" | "reform";

type Field = {
  n: number;
  sx: Float32Array;
  sy: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
  dx: Float32Array;
  dy: Float32Array;
  sr: Uint8Array;
  sg: Uint8Array;
  sb: Uint8Array;
  dr: Uint8Array;
  dg: Uint8Array;
  db: Uint8Array;
  delay: Float32Array;
  /** Pre-scaled wobble phases, as indices into the sine table. */
  phx: Int32Array;
  phy: Int32Array;
  /** dst - src per channel, precomputed: the hot loop runs 90k times a frame. */
  er: Int16Array;
  eg: Int16Array;
  eb: Int16Array;
  /** Per-particle colour perturbation, strongest at peak noise. */
  jr: Int8Array;
  jg: Int8Array;
  jb: Int8Array;
  srcBlock: number;
  dstBlock: number;
};

/** ImageData is byte-ordered; packing 32-bit words depends on host endianness. */
const le = (() => {
  const b = new ArrayBuffer(4);
  new Uint32Array(b)[0] = 1;
  return new Uint8Array(b)[0] === 1;
})();

/**
 * Sine lookup. The drift wobble applies to every particle in every phase now, so
 * calling Math.sin/cos 180k times a frame cost ~5ms; a table makes it two reads.
 */
const SIN_BITS = 10;
const SIN_LEN = 1 << SIN_BITS;
const SIN_MASK = SIN_LEN - 1;
const SIN_SCALE = SIN_LEN / (Math.PI * 2);
const SIN = new Float32Array(SIN_LEN);
for (let i = 0; i < SIN_LEN; i++) SIN[i] = Math.sin((i / SIN_LEN) * Math.PI * 2);

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Give every particle a destination close to where it already is.
 *
 * Pairing by reading order made particles cross the whole viewport, which read
 * as the field imploding onto the new layout. Bucketing the destination by
 * position and handing each particle one from its own neighbourhood keeps travel
 * short, so the page appears to resolve in place.
 */
function assignNearest(f: Field, dst: Particles, w: number, h: number) {
  const gw = Math.max(1, Math.ceil(w / CELL));
  const gh = Math.max(1, Math.ceil(h / CELL));
  const cells = gw * gh;

  const counts = new Int32Array(cells);
  const cellOf = new Int32Array(dst.n);
  for (let j = 0; j < dst.n; j++) {
    const c = ((dst.y[j] / CELL) | 0) * gw + ((dst.x[j] / CELL) | 0);
    cellOf[j] = c;
    counts[c]++;
  }

  const starts = new Int32Array(cells + 1);
  for (let c = 0; c < cells; c++) starts[c + 1] = starts[c] + counts[c];
  const items = new Uint32Array(dst.n);
  const cursor = starts.slice(0, cells);
  for (let j = 0; j < dst.n; j++) items[cursor[cellOf[j]]++] = j;

  // Multi-source BFS: every cell learns the nearest cell that has destinations,
  // so particles over empty regions of the new page still find somewhere close.
  const near = new Int32Array(cells).fill(-1);
  const queue = new Int32Array(cells);
  let qh = 0;
  let qt = 0;
  for (let c = 0; c < cells; c++) {
    if (counts[c] > 0) {
      near[c] = c;
      queue[qt++] = c;
    }
  }
  while (qh < qt) {
    const c = queue[qh++];
    const cx = c % gw;
    const cy = (c / gw) | 0;
    const visit = (nb: number) => {
      if (near[nb] < 0) {
        near[nb] = near[c];
        queue[qt++] = nb;
      }
    };
    if (cx > 0) visit(c - 1);
    if (cx < gw - 1) visit(c + 1);
    if (cy > 0) visit(c - gw);
    if (cy < gh - 1) visit(c + gw);
  }

  const rot = new Int32Array(cells);
  for (let i = 0; i < f.n; i++) {
    const c = ((f.sy[i] / CELL) | 0) * gw + ((f.sx[i] / CELL) | 0);
    const tc = near[Math.min(cells - 1, Math.max(0, c))];
    if (tc < 0) continue;
    const k = counts[tc];
    const j = items[starts[tc] + rot[tc]++ % k];
    f.dx[i] = dst.x[j];
    f.dy[i] = dst.y[j];
    f.dr[i] = dst.r[j];
    f.dg[i] = dst.g[j];
    f.db[i] = dst.b[j];
    f.er[i] = dst.r[j] - f.sr[i];
    f.eg[i] = dst.g[j] - f.sg[i];
    f.eb[i] = dst.b[j] - f.sb[i];
  }
}

function staggered(t: number, delay: number) {
  const p = (t - delay) / (1 - STAGGER);
  return p <= 0 ? 0 : p >= 1 ? 1 : p;
}

export default function DiffusionTransition({
  location,
  children,
}: {
  location: Location;
  children: (displayed: Location) => ReactNode;
}) {
  const [displayed, setDisplayed] = useState(location);
  const [phase, setPhase] = useState<Phase>("idle");

  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rasterRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<ImageData | null>(null);
  const buf32Ref = useRef<Uint32Array | null>(null);
  const field = useRef<Field | null>(null);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const timers = useRef<number[]>([]);
  const pending = useRef<Location | null>(null);
  const reduced = useRef(false);
  const dims = useRef({ w: 0, h: 0 });

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Sized in CSS pixels, not device pixels: a full-resolution ImageData blit
  // costs more per frame than the added sharpness is worth for ~1s of motion.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const w = Math.max(1, Math.floor(window.innerWidth * SCALE));
      const h = Math.max(1, Math.floor(window.innerHeight * SCALE));
      dims.current = { w, h };
      canvas.width = w;
      canvas.height = h;

      let raster = rasterRef.current;
      if (!raster) {
        raster = document.createElement("canvas");
        rasterRef.current = raster;
      }
      raster.width = w;
      raster.height = h;

      const ctx = canvas.getContext("2d");
      const img = ctx ? ctx.createImageData(w, h) : null;
      frameRef.current = img;
      buf32Ref.current = img ? new Uint32Array(img.data.buffer) : null;

    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    if (contentRef.current) warmPosters(contentRef.current);
  }, [displayed.key]);

  // Run one throwaway capture after first paint. Its only purpose is to let the
  // JIT optimise the sampling loops, which otherwise cost ~56ms interpreted on
  // the first navigation instead of ~8ms.
  useEffect(() => {
    const id = window.setTimeout(() => {
      captureParticles();
    }, 700);
    return () => clearTimeout(id);
     
  }, []);

  const captureParticles = (): Particles | null => {
    const raster = rasterRef.current;
    const root = contentRef.current;
    if (!raster || !root) return null;
    const ctx = raster.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const { w, h } = dims.current;
    rasterize(root, ctx, window.innerWidth, window.innerHeight, SCALE);
    return extractParticles(ctx, w, h, PARTICLES);
  };

  // --- render loop ----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (phase === "idle") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const draw = () => {
      raf.current = requestAnimationFrame(draw);
      const f = field.current;
      const frame = frameRef.current;
      if (!f || !frame) return;

      const { w, h } = dims.current;
      const buf32 = buf32Ref.current;
      if (!buf32) return;
      buf32.fill(0);

      const now = performance.now();
      const el = now - startedAt.current;

      let stage: 0 | 1 | 2;
      let t = 0;
      if (el < DISSOLVE_MS) {
        stage = 0;
        t = el / DISSOLVE_MS;
      } else if (el < DISSOLVE_MS + NOISE_MS) {
        stage = 1;
        t = (el - DISSOLVE_MS) / NOISE_MS;
      } else {
        stage = 2;
        t = Math.min(1, (el - DISSOLVE_MS - NOISE_MS) / REFORM_MS);
      }

      const wobX = (now * 0.0015 * SIN_SCALE) | 0;
      const wobY = (now * 0.00135 * SIN_SCALE) | 0;
      // Noise strength: 0 at the page, 1 at peak. Displacement alone reads as
      // blur, so the palette is perturbed too.
      const noiseAmt = stage === 0 ? t : stage === 1 ? 1 : 1 - t;
      const cn = COLOR_NOISE * noiseAmt;
      // Source and destination pages need different square sizes for full
      // coverage. Flipping every particle at once stepped the painted area by
      // ~1.75x in a single frame, which read as a jump between the two pages, so
      // particles switch individually across a window spanning the scrambled
      // middle where it passes for noise.
      const blend =
        f.srcBlock === f.dstBlock
          ? 1
          : Math.min(
              1,
              Math.max(0, (el - DISSOLVE_MS * 0.6) / (DISSOLVE_MS * 0.4 + NOISE_MS))
            );
      const switchAt = blend * STAGGER;
      // Palette crossfade spans the whole transition rather than only the hold,
      // so there is no point where the field changes page in one step.
      const cp = Math.min(
        1,
        Math.max(0, (el - DISSOLVE_MS * 0.45) /
          (DISSOLVE_MS * 0.55 + NOISE_MS + REFORM_MS * 0.4))
      );
      const cpZero = cp <= 0;
      const cpFull = cp >= 1;
      const blkSrc = f.srcBlock;
      const blkDst = f.dstBlock;

      for (let i = 0; i < f.n; i++) {
        let x: number;
        let y: number;
        let r: number;
        let g: number;
        let b: number;
        let a = 255;

        const wamp = 2 * noiseAmt;
        const wx = SIN[(wobX + f.phx[i]) & SIN_MASK] * wamp;
        const wy = SIN[(wobY + f.phy[i] + (SIN_LEN >> 2)) & SIN_MASK] * wamp;

        if (stage === 0) {
          const p = easeInOut(staggered(t, f.delay[i]));
          x = f.sx[i] + (f.nx[i] - f.sx[i]) * p + wx;
          y = f.sy[i] + (f.ny[i] - f.sy[i]) * p + wy;
        } else if (stage === 1) {
          x = f.nx[i] + wx;
          y = f.ny[i] + wy;
        } else {
          const p = easeInOut(staggered(t, f.delay[i]));
          x = f.nx[i] + (f.dx[i] - f.nx[i]) * p + wx * (1 - p);
          y = f.ny[i] + (f.dy[i] - f.ny[i]) * p + wy * (1 - p);
          // Hand over to the real DOM. Generous overlap: by now the field is
          // already the destination page, so a long crossfade costs nothing.
          if (t > 0.68) a = Math.max(0, (255 * (1 - (t - 0.68) / 0.32)) | 0);
        }

        if (cpFull) {
          r = f.dr[i];
          g = f.dg[i];
          b = f.db[i];
        } else if (cpZero) {
          r = f.sr[i];
          g = f.sg[i];
          b = f.sb[i];
        } else {
          r = (f.sr[i] + f.er[i] * cp) | 0;
          g = (f.sg[i] + f.eg[i] * cp) | 0;
          b = (f.sb[i] + f.eb[i] * cp) | 0;
        }
        if (cn > 0) {
          r += (f.jr[i] * cn) >> 7;
          g += (f.jg[i] * cn) >> 7;
          b += (f.jb[i] * cn) >> 7;
        }

        const BLOCK = f.delay[i] < switchAt ? blkDst : blkSrc;
        const xi = x | 0;
        const yi = y | 0;
        if (xi < 0 || yi < 0 || xi >= w - 2 || yi >= h - 2) continue;
        r = r < 0 ? 0 : r > 255 ? 255 : r;
        g = g < 0 ? 0 : g > 255 ? 255 : g;
        b = b < 0 ? 0 : b > 255 ? 255 : b;
        const px = le
          ? ((a << 24) | (b << 16) | (g << 8) | r) >>> 0
          : ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
        // Specialised writes: a per-particle loop bound stopped the engine
        // unrolling this and cost ~5ms a frame.
        const o0 = yi * w + xi;
        if (BLOCK === 1) {
          buf32[o0] = px;
        } else {
          const o1 = o0 + w;
          buf32[o0] = px;
          buf32[o0 + 1] = px;
          buf32[o1] = px;
          buf32[o1 + 1] = px;
        }
      }

      ctx.putImageData(frame, 0, 0);
    };

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  // --- phase machine --------------------------------------------------------
  useEffect(() => {
    if (location.key === displayed.key) return;

    if (reduced.current) {
      setDisplayed(location);
      window.scrollTo(0, 0);
      return;
    }

    const src = captureParticles();
    if (!src || !src.n) {
      setDisplayed(location);
      window.scrollTo(0, 0);
      return;
    }

    clearTimers();
    pending.current = location;

    const { w, h } = dims.current;
    const n = src.n;

    const f: Field = {
      n,
      sx: new Float32Array(n),
      sy: new Float32Array(n),
      nx: new Float32Array(n),
      ny: new Float32Array(n),
      dx: new Float32Array(n),
      dy: new Float32Array(n),
      sr: new Uint8Array(n),
      sg: new Uint8Array(n),
      sb: new Uint8Array(n),
      dr: new Uint8Array(n),
      dg: new Uint8Array(n),
      db: new Uint8Array(n),
      delay: new Float32Array(n),
      phx: new Int32Array(n),
      phy: new Int32Array(n),
      er: new Int16Array(n),
      eg: new Int16Array(n),
      eb: new Int16Array(n),
      jr: new Int8Array(n),
      jg: new Int8Array(n),
      jb: new Int8Array(n),
      srcBlock: src.block,
      dstBlock: src.block,
    };

    for (let i = 0; i < n; i++) {
      const s = i;
      f.sx[i] = src.x[s];
      f.sy[i] = src.y[s];
      f.sr[i] = src.r[s];
      f.sg[i] = src.g[s];
      f.sb[i] = src.b[s];
      // A short hop in a random direction, so the page dissolves in place.
      const ang = Math.random() * Math.PI * 2;
      const rad = JITTER_MIN + Math.random() * (JITTER_MAX - JITTER_MIN);
      f.nx[i] = Math.min(w - 1, Math.max(0, src.x[s] + Math.cos(ang) * rad));
      f.ny[i] = Math.min(h - 1, Math.max(0, src.y[s] + Math.sin(ang) * rad));
      f.dx[i] = src.x[s];
      f.dy[i] = src.y[s];
      f.dr[i] = src.r[s];
      f.dg[i] = src.g[s];
      f.db[i] = src.b[s];
      f.delay[i] = Math.random() * STAGGER;
      const ph = Math.random() * Math.PI * 2;
      f.phx[i] = (ph * SIN_SCALE) | 0;
      f.phy[i] = (ph * 1.3 * SIN_SCALE) | 0;
      f.jr[i] = ((Math.random() * 2 - 1) * 127) | 0;
      f.jg[i] = ((Math.random() * 2 - 1) * 127) | 0;
      f.jb[i] = ((Math.random() * 2 - 1) * 127) | 0;
    }

    field.current = f;
    startedAt.current = performance.now();
    setPhase("dissolve");

    timers.current.push(
      window.setTimeout(() => setPhase("noise"), DISSOLVE_MS),
      window.setTimeout(() => {
        const next = pending.current;
        if (next) {
          setDisplayed(next);
          window.scrollTo(0, 0);
        }
      }, SWAP_AT)
    );

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Rasterise the incoming page once it's mounted, and aim the particles at it.
  useLayoutEffect(() => {
    if (!pending.current || pending.current.key !== displayed.key) return;
    pending.current = null;
    if (reduced.current) return;

    const f = field.current;
    if (!f) return;

    const dst = captureParticles();
    if (dst && dst.n) {
      f.dstBlock = dst.block;
      assignNearest(f, dst, dims.current.w, dims.current.h);
    }

    const elapsed = performance.now() - startedAt.current;
    const untilReform = Math.max(0, DISSOLVE_MS + NOISE_MS - elapsed);
    timers.current.push(
      window.setTimeout(() => setPhase("reform"), untilReform),
      window.setTimeout(() => setPhase("idle"), untilReform + REFORM_MS)
    );
  }, [displayed.key]);

  const busy = phase !== "idle";

  // The particle field already shows the incoming page, so the live DOM only
  // needs to appear underneath it as the particles fade out.
  const contentStyle =
    phase === "idle"
      ? { opacity: 1, transition: "opacity 160ms ease-in" }
      : phase === "reform"
        ? {
            opacity: 1,
            transition: `opacity ${REFORM_MS * 0.3}ms linear ${REFORM_MS * 0.66}ms`,
            willChange: "opacity" as const,
          }
        : { opacity: 0, transition: "opacity 60ms linear", willChange: "opacity" as const };

  const label =
    phase === "dissolve" ? "diffusing" : phase === "noise" ? "sampling" : "denoising";

  return (
    <>
      <div ref={contentRef} style={contentStyle}>
        {children(displayed)}
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[500]"
        style={{ width: "100vw", height: "100vh", opacity: busy ? 1 : 0, imageRendering: "pixelated" }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-16 z-[501] text-center font-mono text-[10px] uppercase tracking-[0.35em] text-subtle"
        style={{ opacity: busy ? 1 : 0, transition: "opacity 160ms linear" }}
      >
        {label}
      </div>
    </>
  );
}
