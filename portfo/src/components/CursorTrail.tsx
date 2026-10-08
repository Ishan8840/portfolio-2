import { useEffect, useRef } from "react";

/** A sparse, short-lived trail of tiny monochrome squares.
 * Only animates while particles are alive; touch and reduced motion stay still.
 */

const MAX = 60;
const LIFE_MS = 400;
const PIXEL = 2;
/** Spawn at most one burst per this interval, regardless of event rate. */
const EMIT_EVERY_MS = 20;

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
        ctx.fillStyle = `rgba(${rgb},${0.26 * (1 - age) * (1 - age)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), PIXEL, PIXEL);
      }

      if (pool.length) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;

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
      const count = Math.min(3, Math.round(speed / 10));
      for (let i = 0; i < count; i++) {
        if (pool.length >= MAX) pool.shift();
        pool.push({
          x: e.clientX + (Math.random() * 2 - 1) * 2,
          y: e.clientY + (Math.random() * 2 - 1) * 2,
          vx: (Math.random() * 2 - 1) * 0.15,
          vy: (Math.random() * 2 - 1) * 0.15,
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
