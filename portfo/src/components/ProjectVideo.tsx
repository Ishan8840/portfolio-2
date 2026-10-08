import { useEffect, useId, useRef, type RefObject } from "react";
import type { Project } from "../data/projects";

/** Share hover/focus playback across linked previews and standalone demos. */
export default function ProjectVideo({
  project,
  linked = false,
}: {
  project: Project;
  linked?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const captionId = useId();
  usePreviewPlayback(ref, linked);

  return (
    <div className={linked ? "project-thumbnail" : "project-media"}>
      <video
        ref={ref}
        src={project.video}
        poster={project.video
          .replace("/videos/", "/posters/")
          .replace(".mp4", ".webp")}
        muted
        loop
        playsInline
        preload="none"
        width="640"
        height="360"
        tabIndex={linked ? undefined : 0}
        aria-label={`${project.title} preview${linked ? "" : ". Focus to play; press Space or Enter to toggle."}`}
        aria-describedby={captionId}
      />
      <span className="video-caption" id={captionId}>
        {project.caption}
      </span>
    </div>
  );
}

function usePreviewPlayback(
  ref: RefObject<HTMLVideoElement | null>,
  linked: boolean,
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const trigger = linked ? video.closest("a") : video;
    if (!trigger) return;
    let hovered = false;
    let focused = false;
    let touch = false;
    let requested = false;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    const stop = () => {
      requested = false;
      video.pause();
      video.currentTime = 0;
    };
    const play = () => {
      requested = true;
      void video
        .play()
        .then(() => {
          // A pending play promise can resolve after the pointer has left.
          if (!requested) video.pause();
        })
        .catch(() => {});
    };
    const sync = () => {
      if ((hovered || focused) && !reducedMotion.matches) play();
      else stop();
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = true;
      sync();
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = false;
      sync();
    };
    const focus = () => {
      focused = !touch;
      sync();
    };
    const blur = () => {
      focused = false;
      touch = false;
      sync();
    };
    const toggle = () => {
      if (requested) stop();
      else play();
    };
    const pointer = (event: PointerEvent) => {
      touch = event.pointerType === "touch";
      if (!linked && touch) {
        event.preventDefault();
        toggle();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (!linked && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        toggle();
      }
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        hovered = false;
        focused = false;
        stop();
      }
    });
    observer.observe(video);
    trigger.addEventListener("pointerenter", enter as EventListener);
    trigger.addEventListener("pointerleave", leave as EventListener);
    trigger.addEventListener("pointerdown", pointer as EventListener);
    trigger.addEventListener("focus", focus);
    trigger.addEventListener("blur", blur);
    trigger.addEventListener("keydown", key as EventListener);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", sync);
    return () => {
      stop();
      observer.disconnect();
      trigger.removeEventListener("pointerenter", enter as EventListener);
      trigger.removeEventListener("pointerleave", leave as EventListener);
      trigger.removeEventListener("pointerdown", pointer as EventListener);
      trigger.removeEventListener("focus", focus);
      trigger.removeEventListener("blur", blur);
      trigger.removeEventListener("keydown", key as EventListener);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [ref, linked]);
}
