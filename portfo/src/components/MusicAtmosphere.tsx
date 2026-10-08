import { music } from "../data/music";
import { useMusic } from "../lib/music-context";

export default function MusicAtmosphere() {
  const { selected, playing } = useMusic();
  return (
    <div className="music-atmosphere" aria-hidden="true">
      {music.map((track, index) => (
        <div
          key={track.audio}
          className="music-wash"
          data-active={selected === index && playing}
          style={{
            background: `radial-gradient(ellipse at 0% 80%, ${track.colors[0]}63, transparent 67.5%), radial-gradient(ellipse at 100% 10%, ${track.colors[1]}4b, transparent 67.5%)`,
          }}
        />
      ))}
    </div>
  );
}
