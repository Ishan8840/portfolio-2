import { useEffect } from "react";

/** Reveal the native page scrollbar during scrolling and near its edge. */
export default function QuietScrollbar() {
  useEffect(() => {
    const root = document.documentElement;
    let timeout = 0;
    let nearEdge = false;
    let dragging = false;
    const hideLater = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        if (!nearEdge && !dragging) root.classList.remove("scrollbar-visible");
      }, 850);
    };
    const reveal = () => {
      root.classList.add("scrollbar-visible");
      hideLater();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const wasNearEdge = nearEdge;
      nearEdge = event.clientX >= window.innerWidth - 28;
      if (nearEdge) reveal();
      else if (wasNearEdge) hideLater();
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.clientX >= root.clientWidth) {
        dragging = true;
        reveal();
      }
    };
    const up = () => {
      dragging = false;
      hideLater();
    };
    const leave = () => {
      nearEdge = false;
      dragging = false;
      hideLater();
    };
    root.classList.add("quiet-scrollbar");
    window.addEventListener("scroll", reveal, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", leave);
    root.addEventListener("pointerleave", leave);
    return () => {
      window.clearTimeout(timeout);
      root.classList.remove("quiet-scrollbar", "scrollbar-visible");
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", leave);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);
  return null;
}
