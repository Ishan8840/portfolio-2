import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useRef, useState } from "react";
import { jobs } from "../data/jobs";

const listVars: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVars: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const Experience: React.FC = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number[]>([]);
  const closeTimer = useRef<number | null>(null);

  // Keyed off the event's own pointerType rather than a `(hover: hover)` media
  // query: the query reports false in environments that do support hovering,
  // which silently disabled the whole interaction.
  const isHoverPointer = (t: string) => t !== "touch";

  const openOn = (id: number) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHovered(id);
  };

  /**
   * Collapsing shifts the entries below it, so a cursor sweeping down the list
   * can land on a different card than the one it was heading for. A short grace
   * period before closing keeps that from flickering.
   */
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHovered(null), 140);
  };

  const togglePin = (id: number) =>
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <section className="flex min-h-screen justify-center px-6 py-35 font-sans">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-14 flex items-end justify-between">
          <h1 className="text-4xl tracking-tight">where i've been.</h1>
          <a
            href="/resume.pdf"
            target="_blank"
            className="border-b border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-all hover:border-gray-500 hover:text-muted"
          >
            Resume
          </a>
        </div>

        <motion.ol
          className="relative"
          variants={listVars}
          initial="initial"
          animate="animate"
        >
          {/* Timeline rail: the logos sit on it as nodes. */}
          <span
            aria-hidden
            className="absolute left-6 top-8 bottom-8 w-px bg-ink/10"
          />

          {jobs.map((job) => {
            const expanded = hovered === job.id || pinned.includes(job.id);
            return (
              <motion.li key={job.id} variants={itemVars}>
                <div
                  onPointerEnter={(e) => {
                    if (isHoverPointer(e.pointerType)) openOn(job.id);
                  }}
                  onPointerLeave={(e) => {
                    if (isHoverPointer(e.pointerType)) closeSoon();
                  }}
                  className={`group relative -mx-4 flex gap-5 rounded-lg px-4 py-5 transition-colors duration-300 ${
                    expanded ? "bg-ink/[0.025]" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={job.img}
                      alt={job.company}
                      className={`h-12 w-12 rounded-lg border object-cover transition-colors duration-300 ${
                        expanded ? "border-ink/25" : "border-ink/10"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="flex flex-wrap items-baseline gap-x-2 text-xl font-bold leading-snug text-ink">
                          <span>{job.role}</span>
                          <a
                            href={job.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-1 ${job.companyColor}`}
                          >
                            {job.company}
                          </a>
                        </h2>

                        <div className="mt-1.5 flex flex-col gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:flex-row sm:items-center sm:gap-2">
                          <span className="whitespace-nowrap">{job.date}</span>
                          <span className="hidden h-[3px] w-[3px] rounded-full bg-subtle sm:block" />
                          <span className="whitespace-nowrap">{job.location}</span>
                        </div>
                      </div>

                      {/* Real button so this is reachable and toggleable by
                          keyboard; focusing it also opens the entry. */}
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} details for ${job.role} at ${job.company}`}
                        onClick={() => togglePin(job.id)}
                        onFocus={() => setHovered(job.id)}
                        onBlur={closeSoon}
                        className={`mt-2 shrink-0 rounded p-1 text-subtle transition-all duration-300 hover:text-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30 ${
                          expanded
                            ? "opacity-100"
                            : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        }`}
                      >
                        <svg
                          viewBox="0 0 10 6"
                          className={`h-1.5 w-2.5 transition-transform duration-300 ${
                            expanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.tech.map((t) => (
                        <span
                          key={t}
                          className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                            expanded
                              ? "border-ink bg-surface text-ink"
                              : "border-ink/25 text-muted"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="relative mt-3 overflow-hidden">
                      <AnimatePresence mode="wait" initial={false}>
                        {expanded ? (
                          <motion.ul
                            key="bullets"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="ml-4 list-disc space-y-2 text-sm leading-relaxed text-ink"
                          >
                            {job.bullets.map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </motion.ul>
                        ) : (
                          <motion.p
                            key="desc"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="text-sm leading-relaxed text-muted"
                          >
                            {job.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </motion.div>
    </section>
  );
};

export default Experience;
