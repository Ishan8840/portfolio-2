import { useEffect, useRef, useState, type ReactNode } from "react";
import { music } from "../data/music";
import { MusicContext } from "../lib/music-context";

// One audio element lives above the routes, so navigation never restarts it.
export default function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
    };
  }, []);

  const toggle = async (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++requestRef.current;
    setError("");
    if (selected === index && (!audio.paused || loading)) {
      audio.pause();
      setPlaying(false);
      setLoading(false);
      return;
    }
    if (selected !== index) {
      audio.pause();
      audio.src = music[index].audio;
      setSelected(index);
      setPlaying(false);
    }
    setLoading(true);
    try {
      await audio.play();
      if (request === requestRef.current && audio.isConnected) {
        setPlaying(true);
        setLoading(false);
      }
    } catch {
      if (request === requestRef.current && audio.isConnected) {
        setPlaying(false);
        setLoading(false);
        setError("Couldn’t play this song. Tap the cover to try again.");
      }
    }
  };

  return (
    <MusicContext.Provider
      value={{ selected, playing, loading, error, toggle }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="none"
        loop
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setLoading(false);
        }}
        onError={() => {
          setPlaying(false);
          setLoading(false);
          setError("Couldn’t play this song. Tap the cover to try again.");
        }}
      />
    </MusicContext.Provider>
  );
}
