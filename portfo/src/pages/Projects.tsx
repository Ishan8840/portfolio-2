import { motion } from "framer-motion";
import { useRef } from "react";
import { projects, type Project } from "../data/projects";

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const primary = project.website || project.demo || project.github;

  // Hovering anywhere on the card plays the clip, not just the media box.
  // play() rejects with AbortError when a pause lands mid-load, which is normal
  // when the pointer sweeps across — swallow it rather than logging on every pass.
  const play = () => {
    void videoRef.current?.play().catch(() => {});
  };
  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  const title = (
    <span className="relative inline-block px-1">
      {/* Own layer so the fill can deepen on hover without fading the text. */}
      <span
        aria-hidden
        className={`absolute inset-0 ${project.color} opacity-55 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <span className="relative">{project.title}</span>
    </span>
  );

  return (
    <article
      className="group relative flex flex-col gap-6"
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      <div className="relative block overflow-hidden rounded-md border border-ink/10 bg-ink/5">
        <video
          ref={videoRef}
          src={project.video}
          poster={project.poster}
          muted
          loop
          playsInline
          // Without this the browser fully buffers the clip on every visit; now
          // only the poster loads, and the clip fetches on hover.
          preload="none"
          className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      <div>
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-2xl font-bold text-ink">
            {primary ? (
              // Stretched link: the ::after covers the whole card, so a click
              // anywhere opens the project. Nesting real anchors would be
              // invalid HTML, and the icon links below sit above it on z-10.
              <a
                href={primary}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
              >
                {title}
              </a>
            ) : (
              title
            )}
          </h2>

          {/* Above the stretched overlay so each icon keeps its own target. */}
          <div className="relative z-10 flex shrink-0 gap-4 items-center">
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink transition-colors"
                aria-label={`${project.title} website`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </a>
            )}

            {project.twitter && (
              <a
                href={project.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink transition-colors"
                aria-label={`${project.title} on Twitter`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}

            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink transition-colors"
                aria-label={`${project.title} on GitHub`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            )}

            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink transition-colors"
                aria-label={`${project.title} live demo`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            )}
          </div>
        </div>

        <p className="mt-3 text-base text-muted leading-relaxed max-w-xl">
          {project.description}
        </p>

        {/* Same badge as Experience and Writing: quiet at rest, solid on hover. */}
        <div className="flex flex-wrap gap-2 mt-4">
          {project.tech.map((t) => (
            <span
              key={t}
              className="border border-ink/25 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted transition-colors duration-300 group-hover:border-ink group-hover:bg-surface group-hover:text-ink"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

const Projects: React.FC = () => {
  return (
    <section className="min-h-screen py-35 px-6 flex justify-center font-sans">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-end mb-14">
          <h1 className="text-4xl tracking-tight">
            what i've built.
          </h1>
        </div>

        <div className="flex flex-col gap-16">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Projects;
