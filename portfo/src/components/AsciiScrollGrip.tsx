import { useEffect, useRef } from "react";

const ROWS = 35;

/** A localized ASCII swell indicates page position; the whole rail is draggable. */
export default function AsciiScrollGrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current,
      marks = marksRef.current;
    if (!track || !marks) return;
    const root = document.documentElement;
    const desktop = matchMedia(
      "(hover: hover) and (pointer: fine) and (forced-colors: none)",
    );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      lastTime = 0,
      target = 0,
      current = 0;
    let pointerId: number | null = null;
    const rows = Array.from({ length: ROWS }, () => {
      const row = document.createElement("span");
      row.className = "ascii-scrollbar-row";
      const dash = document.createElement("span");
      dash.textContent = "------|";
      row.append(dash);
      return row;
    });
    marks.replaceChildren(...rows);
    const range = () => Math.max(0, root.scrollHeight - root.clientHeight);
    const paint = () => {
      rows.forEach((row, i) => {
        const distance = (i / (ROWS - 1) - current) / 0.095;
        const strength = Math.exp((-distance * distance) / 2);
        const dash = row.firstElementChild as HTMLElement;
        dash.style.width = `${6 + strength * 24}px`;
        row.style.opacity = String(0.5 + strength * 0.5);
      });
    };
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      current += (target - current) * (1 - Math.exp(-dt * 14));
      if (Math.abs(target - current) < 0.0001) current = target;
      paint();
      frame = current === target ? 0 : requestAnimationFrame(animate);
    };
    const sync = () => {
      root.classList.toggle("ascii-scrollbar-enabled", desktop.matches);
      const max = range();
      track.hidden = !desktop.matches || max <= 1;
      target = max ? Math.max(0, Math.min(1, scrollY / max)) : 0;
      track.setAttribute("aria-valuenow", String(Math.round(target * 100)));
      if (reduced.matches || track.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        current = target;
        paint();
      } else if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    const seek = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (clientY - rect.top - 8) / (rect.height - 16)),
      );
      window.scrollTo({ top: fraction * range(), behavior: "instant" });
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      track.setPointerCapture(pointerId);
      track.focus({ preventScroll: true });
      track.classList.add("is-dragging");
      seek(event.clientY);
    };
    const move = (event: PointerEvent) => {
      if (pointerId === event.pointerId) seek(event.clientY);
    };
    const release = () => {
      const id = pointerId;
      pointerId = null;
      if (id !== null && track.hasPointerCapture(id))
        track.releasePointerCapture(id);
      track.classList.remove("is-dragging");
    };
    const key = (event: KeyboardEvent) => {
      let next = scrollY;
      switch (event.key) {
        case "ArrowDown":
          next += 40;
          break;
        case "ArrowUp":
          next -= 40;
          break;
        case "PageDown":
          next += innerHeight * 0.85;
          break;
        case "PageUp":
          next -= innerHeight * 0.85;
          break;
        case " ":
          next += innerHeight * 0.85 * (event.shiftKey ? -1 : 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = range();
          break;
        default:
          return;
      }
      event.preventDefault();
      window.scrollTo({ top: next, behavior: "instant" });
    };
    const preferences = () => {
      release();
      sync();
    };
    const observer = new ResizeObserver(sync);
    observer.observe(document.body);
    observer.observe(root);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("blur", release);
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    track.addEventListener("lostpointercapture", release);
    track.addEventListener("keydown", key);
    desktop.addEventListener("change", preferences);
    reduced.addEventListener("change", preferences);
    return () => {
      release();
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.classList.remove("ascii-scrollbar-enabled");
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("blur", release);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", release);
      track.removeEventListener("pointercancel", release);
      track.removeEventListener("lostpointercapture", release);
      track.removeEventListener("keydown", key);
      desktop.removeEventListener("change", preferences);
      reduced.removeEventListener("change", preferences);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="ascii-scrollbar"
      role="scrollbar"
      aria-label="Page scroll"
      aria-controls="main-content"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      hidden
    >
      <span
        ref={marksRef}
        className="ascii-scrollbar-marks"
        aria-hidden="true"
      />
    </div>
  );
}
