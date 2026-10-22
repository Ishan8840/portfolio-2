import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMusic } from "../lib/music-context";
import { albumPalette, type MusicPalette } from "../lib/music-palette";
import { startAsciiTurtles } from "../lib/ascii-turtles";

export default function SwimmingTurtle() {
  const { selected, playing } = useMusic();
  const { pathname } = useLocation();
  const readingRef = useRef(false);
  const paletteRef = useRef<MusicPalette | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    readingRef.current =
      pathname === "/writing" || pathname.startsWith("/writing/");
  }, [pathname]);
  useEffect(() => {
    paletteRef.current =
      playing && selected !== null ? albumPalette(selected) : null;
    canvasRef.current?.dispatchEvent(new Event("palettechange"));
  }, [selected, playing]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas)
      return startAsciiTurtles(
        canvas,
        () => paletteRef.current,
        () => readingRef.current,
      );
  }, []);
  return (
    <canvas ref={canvasRef} className="ascii-turtles" aria-hidden="true" />
  );
}
