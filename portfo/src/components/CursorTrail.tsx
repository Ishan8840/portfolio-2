import { useEffect, useRef } from "react";

/**
 * A short pixel trail behind the cursor, echoing the page transition: square
 * monochrome pixels that scatter slightly and fade.
 *
 * Kept deliberately sparse — the transition can afford 90k particles because it
 * owns the screen for a second, whereas this sits under everything you read all
 * the time. Emission is rate-limited and tied to pointer speed, so it reacts to
 * a flick and stays nearly invisible during slow, deliberate movement.
 *
 * The render loop only runs while pixels are alive, so an idle page costs
 * nothing. Disabled for touch pointers and for prefers-reduced-motion.
 */

const MAX = 260;
const LIFE_MS = 520;
const PIXEL = 2;
/** Spawn at most one burst per this interval, regardless of event rate. */
const EMIT_EVERY_MS = 16;

type P = { x: number; y: number; vx: number; vy: number; born: number };

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    // Read the ink colour from the page so the trail follows the theme.
    const ink = getComputedStyle(document.body).color || "rgb(17,17,16)";
    const rgb = ink.match(/\d+/g)?.slice(0, 3).join(",") ?? "17,17,16";

    const pool: P[] = [];
    let raf = 0;
    let lastEmit = 0;
    let px = 0;
    let py = 0;
    let primed = false;

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        const age = (now - p.born) / LIFE_MS;
        if (age >= 1) {
          pool.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        ctx.fillStyle = `rgba(${rgb},${0.34 * (1 - age) * (1 - age)})`;
        ctx.fillRect(p.x, p.y, PIXEL, PIXEL);
      }

      if (pool.length) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const now = performance.now();
      if (!primed) {
        px = e.clientX;
        py = e.clientY;
        primed = true;
        return;
      }

      const dx = e.clientX - px;
      const dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;

      if (now - lastEmit < EMIT_EVERY_MS) return;
      lastEmit = now;

      // Faster movement sheds more pixels; slow movement barely any.
      const speed = Math.hypot(dx, dy);
      const count = Math.min(4, Math.round(speed / 9));
      for (let i = 0; i < count; i++) {
        if (pool.length >= MAX) pool.shift();
        pool.push({
          x: e.clientX + (Math.random() * 2 - 1) * 5,
          y: e.clientY + (Math.random() * 2 - 1) * 5,
          vx: (Math.random() * 2 - 1) * 0.5,
          vy: (Math.random() * 2 - 1) * 0.5,
          born: now,
        });
      }
      if (!raf && pool.length) raf = requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", fit);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[400]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
