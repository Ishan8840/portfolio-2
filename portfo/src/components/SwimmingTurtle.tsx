import { useEffect, useRef } from "react";
import { useMusic } from "../lib/music-context";
import { albumPalette, type MusicPalette } from "../lib/music-palette";
import { startAsciiTurtles } from "../lib/ascii-turtles";

export default function SwimmingTurtle() {
  const { selected, playing } = useMusic();
  const paletteRef = useRef<MusicPalette | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    paletteRef.current =
      playing && selected !== null ? albumPalette(selected) : null;
    canvasRef.current?.dispatchEvent(new Event("palettechange"));
  }, [selected, playing]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) return startAsciiTurtles(canvas, () => paletteRef.current);
  }, []);
  return (
    <canvas ref={canvasRef} className="ascii-turtles" aria-hidden="true" />
  );
}
