/**
 * Paints the live DOM into a 2D canvas so a transition can work with the page's
 * real pixels — actual glyphs, images and colours — instead of stand-in dots.
 *
 * This is deliberately not a general-purpose DOM renderer (no html2canvas
 * dependency, no SVG foreignObject). It handles what this site actually uses:
 * text, images, video posters, background fills and borders. Anything it can't
 * express simply doesn't contribute pixels, which for a sub-second transition is
 * invisible.
 */

export type Particles = {
  x: Float32Array;
  y: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  n: number;
  /** Side of the square each particle should paint for full coverage. */
  block: number;
};

/** Poster images for <video> elements, which have no decoded frame until played. */
const posterCache = new Map<string, HTMLImageElement>();

export function warmPosters(root: HTMLElement) {
  for (const v of Array.from(root.querySelectorAll("video"))) {
    const src = v.getAttribute("poster");
    if (!src || posterCache.has(src)) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    posterCache.set(src, img);
  }
}

function parseColor(c: string): [number, number, number, number] | null {
  if (!c || c === "transparent" || c === "none") return null;
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((s) => parseFloat(s));
  const a = p.length > 3 ? p[3] : 1;
  if (a <= 0.01) return null;
  return [p[0], p[1], p[2], a];
}

const rgba = (c: [number, number, number, number]) =>
  `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;

/** Replicate object-fit: cover / contain for a media element. */
function drawMedia(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  natW: number,
  natH: number,
  rect: DOMRect,
  fit: string
) {
  if (!natW || !natH) return;
  const scale =
    fit === "contain"
      ? Math.min(rect.width / natW, rect.height / natH)
      : Math.max(rect.width / natW, rect.height / natH);
  const dw = natW * scale;
  const dh = natH * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top, rect.width, rect.height);
  ctx.clip();
  ctx.drawImage(
    src,
    rect.left + (rect.width - dw) / 2,
    rect.top + (rect.height - dh) / 2,
    dw,
    dh
  );
  ctx.restore();
}

function paintElement(
  el: HTMLElement,
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  backdrop: [number, number, number, number] | null
) {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) return;

  const bg = parseColor(cs.backgroundColor);
  // A fill matching the page backdrop adds no visible information, but it does
  // turn every pixel it covers into "content" — a full-height wrapper painted in
  // the body colour made the particle field span the whole viewport and spent
  // most of the budget on empty background.
  const isBackdrop =
    bg !== null &&
    backdrop !== null &&
    Math.abs(bg[0] - backdrop[0]) < 6 &&
    Math.abs(bg[1] - backdrop[1]) < 6 &&
    Math.abs(bg[2] - backdrop[2]) < 6;

  if (bg && !isBackdrop) {
    ctx.fillStyle = rgba(bg);
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  }

  const bw = parseFloat(cs.borderTopWidth) || 0;
  if (bw > 0) {
    const bc = parseColor(cs.borderTopColor);
    if (bc) {
      ctx.strokeStyle = rgba(bc);
      ctx.lineWidth = bw;
      ctx.strokeRect(
        rect.left + bw / 2,
        rect.top + bw / 2,
        rect.width - bw,
        rect.height - bw
      );
    }
  }

  if (el instanceof HTMLImageElement) {
    if (el.complete && el.naturalWidth) {
      drawMedia(ctx, el, el.naturalWidth, el.naturalHeight, rect, cs.objectFit);
    }
  } else if (el instanceof HTMLVideoElement) {
    if (el.readyState >= 2 && el.videoWidth) {
      drawMedia(ctx, el, el.videoWidth, el.videoHeight, rect, cs.objectFit);
    } else {
      const src = el.getAttribute("poster");
      const img = src ? posterCache.get(src) : undefined;
      if (img?.complete && img.naturalWidth) {
        drawMedia(ctx, img, img.naturalWidth, img.naturalHeight, rect, cs.objectFit);
      }
    }
  }
}

function paintText(node: Text, ctx: CanvasRenderingContext2D, vh: number) {
  const text = node.nodeValue;
  if (!text || !text.trim()) return;
  const parent = node.parentElement;
  if (!parent) return;

  const cs = getComputedStyle(parent);
  if (cs.visibility === "hidden" || +cs.opacity === 0) return;
  const color = parseColor(cs.color);
  if (!color) return;

  ctx.fillStyle = rgba(color);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  // Chrome honours this and the site leans on wide tracking for its mono labels.
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  }

  // A Range gives text its exact on-screen box, so wrapping, alignment and
  // inline layout come for free. Most nodes here occupy a single line box, and
  // those need just one measurement — per-word measuring every node was the
  // dominant cost of capturing a page.
  const range = document.createRange();
  range.selectNodeContents(node);
  const lines = range.getClientRects();

  if (lines.length === 1) {
    const r = lines[0];
    if (r.width > 0 && r.bottom >= 0 && r.top <= vh) {
      ctx.fillText(text.trim(), r.left, r.top + r.height / 2);
    }
    return;
  }

  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const r = range.getBoundingClientRect();
    if (r.width <= 0 || r.bottom < 0 || r.top > vh) continue;
    ctx.fillText(m[0], r.left, r.top + r.height / 2);
  }
}

export function rasterize(
  root: HTMLElement,
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  scale = 1
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, vw * scale, vh * scale);
  ctx.save();
  // Paint in CSS coordinates; the transform maps them into the smaller buffer.
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const backdrop = parseColor(getComputedStyle(document.body).backgroundColor);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      paintElement(node as HTMLElement, ctx, vw, vh, backdrop);
    } else if (node.nodeType === Node.TEXT_NODE) {
      paintText(node as Text, ctx, vh);
    }
    node = walker.nextNode();
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Scratch buffer for candidate pixel indices, reused across captures. */
let candidates: Uint32Array | null = null;

/**
 * Pull exactly `target` particles out of a rasterised frame.
 *
 * Always returning the same count matters: a sparse page (the home page is a
 * heading, four icons, a paragraph and four tags) has far fewer content pixels
 * than a page of screenshots, and sizing the field from whichever page you
 * happened to start on made those transitions look almost empty. Sparse pages
 * are sampled with replacement, dense pages thinned, and `block` reports how
 * large a square each particle should paint to keep coverage full either way.
 */
export function extractParticles(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  target: number
): Particles {
  const img = ctx.getImageData(0, 0, vw, vh);
  const d = img.data;

  const cells = vw * vh;
  if (!candidates || candidates.length < cells) candidates = new Uint32Array(cells);
  const xs = candidates;

  let total = 0;
  // Row-major scan at full resolution, so the result is already in reading
  // order and needs no sort.
  for (let i = 0, p = 3; i < cells; i++, p += 4) {
    if (d[p] > 24) xs[total++] = i;
  }

  const n = total === 0 ? 0 : target;
  const out: Particles = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    r: new Uint8Array(n),
    g: new Uint8Array(n),
    b: new Uint8Array(n),
    n,
    // Enough coverage that the particles reproduce the page rather than dither
    // it: 1px squares when we have a particle per content pixel, larger when
    // the page had to be thinned.
    // Round up so dense pages read as solid rather than dithered, but cap at 2:
    // the per-frame cost is block² writes per particle.
    block: Math.max(1, Math.min(2, Math.ceil(Math.sqrt(total / n)))),
  };
  if (!total) return out;

  // Uniform stride: thins evenly when total > n, and repeats evenly when the
  // page is sparse enough that total < n.
  const stride = total / n;
  for (let i = 0; i < n; i++) {
    const idx = xs[Math.min(total - 1, Math.floor(i * stride))];
    const p = idx * 4;
    out.x[i] = idx % vw;
    out.y[i] = (idx / vw) | 0;
    out.r[i] = d[p];
    out.g[i] = d[p + 1];
    out.b[i] = d[p + 2];
  }
  return out;
}

