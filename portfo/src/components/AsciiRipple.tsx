import { useEffect, useRef } from "react";
import { useMusic } from "../lib/music-context";
import { albumPalette } from "../lib/music-palette";
import { isPageClick, turtleClicks } from "../lib/click-effects";

const LIFE_MS = 500;
const RADIUS = 14;
const MARK_COUNT = 5;
const MAX_RIPPLES = 6;
const GLYPHS = ".:~-=;/\\|ox";
type Mark = { x: number; y: number; glyph: string };
type Ripple = {
  x: number;
  y: number;
  born: number;
  color: string;
  marks: Mark[];
};

export default function AsciiRipple() {
  const { selected, playing } = useMusic();
  const colorRef = useRef("91,103,98");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    colorRef.current =
      playing && selected !== null
        ? albumPalette(selected)[0].join(",")
        : "91,103,98";
  }, [selected, playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let ripples: Ripple[] = [];
    let raf = 0;
    let alive = true;
    let pointer: { x: number; y: number; id: number; moved: boolean } | null =
      null;
    const clear = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ripples = [];
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    const fit = () => {
      clear();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };
    const draw = (now: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ripples = ripples.filter((ripple) => now - ripple.born < LIFE_MS);
      for (const ripple of ripples) {
        const age = (now - ripple.born) / LIFE_MS;
        const scale = 0.35 + 0.65 * (1 - (1 - age) ** 1.5);
        const opacity = Math.min(1, age * 10) * (1 - age) ** 1.2 * 0.8;
        ctx.fillStyle = `rgba(${ripple.color},${opacity * 0.72})`;
        for (const mark of ripple.marks) {
          ctx.fillText(
            mark.glyph,
            ripple.x + mark.x * scale,
            ripple.y + mark.y * scale,
          );
        }
      }
      raf = ripples.length ? requestAnimationFrame(draw) : 0;
    };
    const click = (event: MouseEvent) => {
      const dragged = pointer?.moved;
      // Turtle hit testing runs in the same event; defer until every handler finishes.
      queueMicrotask(() => {
        if (
          !alive ||
          dragged ||
          reduced.matches ||
          document.hidden ||
          turtleClicks.has(event) ||
          !isPageClick(event)
        )
          return;
        const marks: Mark[] = Array.from({ length: MARK_COUNT }, (_, i) => {
          const angle = (i / MARK_COUNT) * Math.PI * 2;
          return {
            x: Math.cos(angle) * RADIUS,
            y: Math.sin(angle) * RADIUS,
            glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          };
        });
        ripples.push({
          x: event.clientX,
          y: event.clientY,
          born: performance.now(),
          color: colorRef.current,
          marks,
        });
        ripples = ripples.slice(-MAX_RIPPLES);
        if (!raf) raf = requestAnimationFrame(draw);
      });
    };
    const down = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    };
    const move = (e: PointerEvent) => {
      if (
        pointer?.id === e.pointerId &&
        Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 8
      )
        pointer.moved = true;
    };
    const cancel = () => {
      if (pointer) pointer.moved = true;
    };
    fit();
    window.addEventListener("click", click);
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", clear, { passive: true });
    document.addEventListener("visibilitychange", clear);
    reduced.addEventListener("change", clear);
    return () => {
      alive = false;
      clear();
      window.removeEventListener("click", click);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", clear);
      document.removeEventListener("visibilitychange", clear);
      reduced.removeEventListener("change", clear);
    };
  }, []);

  return <canvas ref={canvasRef} className="ascii-ripple" aria-hidden="true" />;
}
