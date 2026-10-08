import { useMusic } from "../lib/music-context";
import { music } from "../data/music";

export default function MusicShelf() {
  const { selected, playing, loading, error, toggle } = useMusic();

  return (
    <section
      className="home-section music-section"
      aria-labelledby="music-heading"
    >
      <div className="section-heading">
        <h2 id="music-heading">On repeat</h2>
        <span className="music-status" role="status">
          {loading
            ? "Loading…"
            : playing
              ? "Listening"
              : "Click a cover to listen"}
        </span>
      </div>
      <div className="music-shelf">
        {music.map((track, index) => {
          const active = selected === index && playing;
          const pending = selected === index && loading;
          return (
            <button
              key={track.audio}
              type="button"
              className="music-track"
              aria-label={`${active || pending ? "Pause" : "Play"} ${track.title}`}
              aria-pressed={active || pending}
              onClick={() => void toggle(index)}
            >
              <span className="music-cover">
                <img
                  src={track.cover}
                  alt=""
                  width="233"
                  height="233"
                  loading="lazy"
                  decoding="async"
                />
                <span className="music-control" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="currentColor"
                  >
                    {active || pending ? (
                      <path d="M4 3h3v10H4zm5 0h3v10H9z" />
                    ) : (
                      <path d="m5 3 8 5-8 5z" />
                    )}
                  </svg>
                </span>
              </span>
              <span className="music-title">{track.title}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="music-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
