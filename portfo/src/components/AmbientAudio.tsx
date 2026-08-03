import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Background music with a persistent toggle.
 *
 * Browsers block audio-with-sound from starting without a user gesture, so a
 * true "plays on load" is not achievable — `play()` rejects with
 * NotAllowedError. So it starts at the earliest moment allowed: the visitor's
 * first click, tap or keypress anywhere on the page. Muting is remembered and
 * suppresses that on later visits.
 *
 * The track is only fetched once playback is attempted (preload="none"), so it
 * costs nothing to anyone who leaves immediately. If the file is missing the
 * control hides rather than showing a dead button.
 */

const SRC = "/audio/lala-128.mp3";
const PREF_KEY = "ambient-audio";
const VOLUME = 0.32;
const FADE_MS = 700;

export default function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);

  /** Ramp volume so the track doesn't slam in or cut out. */
  const fadeTo = useCallback((target: number, done?: () => void) => {
    const el = audioRef.current;
    if (!el) return;
    if (fadeRef.current) clearInterval(fadeRef.current);
    const start = el.volume;
    const t0 = performance.now();
    fadeRef.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / FADE_MS);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * p));
      if (p >= 1) {
        if (fadeRef.current) clearInterval(fadeRef.current);
        fadeRef.current = null;
        done?.();
      }
    }, 32);
  }, []);

  const start = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return false;
    el.volume = 0;
    try {
      await el.play();
    } catch {
      // Gesture requirement not met, or the file is missing.
      return false;
    }
    fadeTo(VOLUME);
    setPlaying(true);
    return true;
  }, [fadeTo]);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    fadeTo(0, () => el.pause());
    setPlaying(false);
  }, [fadeTo]);

  // Only show the control if the file actually exists. A 200 isn't enough:
  // SPA hosts (and Vite's dev server) answer unknown paths with index.html, so
  // a missing track would otherwise look present and give a dead button.
  useEffect(() => {
    let cancelled = false;
    fetch(SRC, { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") || "";
        if (!cancelled) setAvailable(r.ok && !type.includes("text/html"));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Start at the visitor's first interaction anywhere on the page — the
   * earliest point a browser will allow audio — unless they have explicitly
   * muted it before, in which case that choice sticks across visits.
   */
  useEffect(() => {
    if (!available) return;
    if (localStorage.getItem(PREF_KEY) === "off") return;

    const arm = async (e: Event) => {
      // A click on the control itself is the toggle's job. Starting here too
      // would race it: this begins playback, then the click handler sees a
      // playing track and immediately stops it.
      const el = e.target as Element | null;
      if (el?.closest?.("[data-ambient-toggle]")) {
        remove();
        return;
      }
      // Only stop listening once playback actually took, so a rejected attempt
      // can still succeed on a later gesture.
      if (await start()) remove();
    };
    // pointerdown covers mouse (it maps to mousedown, which grants activation),
    // but on touch activation only arrives at touchend/click — a pointerdown
    // attempt there fails with NotAllowedError. Listening to several events and
    // only unsubscribing once playback takes covers both.
    const EVENTS = ["pointerdown", "pointerup", "click", "keydown"] as const;
    const remove = () => {
      for (const t of EVENTS) window.removeEventListener(t, arm);
    };
    for (const t of EVENTS) window.addEventListener(t, arm);
    return remove;
  }, [available, start]);

  useEffect(() => {
    return () => {
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  const toggle = async () => {
    if (playing) {
      stop();
      localStorage.setItem(PREF_KEY, "off");
    } else if (await start()) {
      localStorage.setItem(PREF_KEY, "on");
    }
  };

  if (!available) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="none"
        onError={() => setAvailable(false)}
      />
      <button
        type="button"
        data-ambient-toggle
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mute background music" : "Play background music"}
        title={playing ? "Mute" : "Play music"}
        className="group fixed bottom-24 left-6 z-50 flex items-end gap-[3px] rounded p-2 transition-opacity duration-300 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30 md:bottom-7 md:left-8"
        style={{ opacity: playing ? 1 : 0.45 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[2px] bg-ink/70 transition-all duration-300 group-hover:bg-ink"
            style={
              playing
                ? { height: 12, animation: `eq 900ms ease-in-out ${i * 140}ms infinite` }
                : { height: i === 1 ? 8 : 4 }
            }
          />
        ))}
      </button>
    </>
  );
}
