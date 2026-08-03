import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Background music with a persistent toggle.
 *
 * Browsers block audio-with-sound from starting without a user gesture, so a
 * true "plays on load" is not achievable — `play()` rejects with
 * NotAllowedError. What this does instead: remember the visitor's choice, and if
 * they had it on, arm playback to resume on their very first interaction of the
 * next visit. First-time visitors get silence until they ask for sound.
 *
 * The track lives at public/audio/lala.mp3 and is only fetched when someone
 * actually presses play (preload="none"), so it costs first-time visitors
 * nothing. If the file is missing the control hides rather than showing a dead
 * button.
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

  // If they left it on last time, resume at the first gesture of this visit.
  useEffect(() => {
    if (!available) return;
    if (localStorage.getItem(PREF_KEY) !== "on") return;

    const arm = () => {
      void start();
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
    window.addEventListener("pointerdown", arm, { once: false });
    window.addEventListener("keydown", arm, { once: false });
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
