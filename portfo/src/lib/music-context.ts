import { createContext, useContext } from "react";

type MusicState = {
  selected: number | null;
  playing: boolean;
  loading: boolean;
  error: string;
  toggle: (index: number) => Promise<void>;
};

export const MusicContext = createContext<MusicState | null>(null);

export function useMusic() {
  const music = useContext(MusicContext);
  if (!music) throw new Error("useMusic requires MusicProvider");
  return music;
}
