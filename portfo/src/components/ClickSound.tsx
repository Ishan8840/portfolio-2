import { useEffect } from "react";
import { playClick, primeClick, unlockClick } from "../lib/click-sound";

/**
 * Ticks on every primary press anywhere on the page, not only on interactive
 * elements.
 *
 * Independent of the background music: muting the music silences the music
 * only, so click feedback survives. Secondary buttons are ignored, so opening a
 * context menu stays silent.
 */

export default function ClickSound() {
  useEffect(() => {
    // Decode up front so the very first press isn't swallowed.
    primeClick();

    // An AudioContext created before any interaction starts suspended, and
    // scheduling on a suspended context loses the sound. Resume at the first
    // gesture so the clock is already running when a press needs to sound.
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      unlockClick();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // primary button and touch only
      unlock();
      playClick();
    };

    const onKey = (e: KeyboardEvent) => {
      unlock();
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      // Typing stays silent; only the keys that actually navigate tick.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (/^[1-4jk]$/i.test(e.key) || e.key === "Enter") playClick(0.8);
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
