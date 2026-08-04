import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import postsData from "../data/blog-posts.json";

interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string[];
  color: string;
  readTime?: string;
}

const posts = (postsData as Post[]) || [];

const Writing: React.FC = () => {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    // Tags are searchable even though there is no tag filter UI — typing "vla"
    // should still surface the posts tagged with it.
    return posts.filter((post) =>
      [post.title, post.description, ...(post.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  return (
    <section className="min-h-screen py-35 px-6 flex justify-center font-sans">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap justify-between items-end gap-4 mb-14">
          <h1 className="text-4xl tracking-tight">
            words i've written.
          </h1>

          <label className="flex items-center gap-2 border-b border-ink/25 pb-1 transition-colors focus-within:border-ink">
            <svg
              aria-hidden
              viewBox="0 0 14 14"
              className="h-3 w-3 shrink-0 text-subtle"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="6" cy="6" r="4.25" />
              <path d="M9.2 9.2 12.5 12.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="search"
              aria-label="Search posts"
              className="w-28 bg-transparent font-mono text-[11px] uppercase tracking-[0.2em] text-ink placeholder:text-subtle focus:w-40 focus:outline-none transition-[width] duration-300"
            />
          </label>
        </div>

        <div className="flex flex-col gap-6">
          {posts.length === 0 ? (
            <p className="text-muted italic">No posts found.</p>
          ) : visible.length === 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              nothing matches
              <span className="text-ink"> “{query.trim()}”</span>.{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="border-b border-ink text-ink hover:text-muted hover:border-muted transition-colors"
              >
                clear search
              </button>
            </p>
          ) : (
            visible.map((post) => (
              <Link
                key={post.id}
                to={`/writing/${post.slug}`}
                className="group block no-underline border-b border-ink/10 pb-6 last:border-0"
              >
                <article className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    {/* Meta sits above the title rather than inside the <h2>:
                        on the baseline next to a 2xl heading it wrapped into
                        the title with no row gap. Mirrors Experience.tsx. */}
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      <span className="whitespace-nowrap">{post.date}</span>
                      {post.readTime && (
                        <>
                          <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-subtle" />
                          <span className="whitespace-nowrap">{post.readTime}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="text-2xl font-bold text-ink">
                        {/* The highlight is its own layer so it can fade on
                            hover without taking the text with it. The previous
                            bg-opacity-* utilities were removed in Tailwind v4
                            and compiled to nothing, so this never worked. */}
                        <span className="relative inline-block px-1">
                          <span
                            aria-hidden
                            className={`absolute inset-0 ${post.color} opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                          />
                          <span className="relative">{post.title}</span>
                        </span>
                      </h2>

                      <span className="hidden sm:block shrink-0 text-ink transform translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 font-light text-2xl">
                        →
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-muted leading-relaxed max-w-xl">
                    {post.description}
                  </p>

                  {/* Experience.tsx's tag idiom: quiet at rest, solid when the
                      entry is active. Solid-black boxes at rest carried the
                      same weight as the titles, so seven posts read as fourteen
                      competing blocks — but plain text made this the only page
                      without the shared badge. `uppercase` also hides the
                      inconsistent tag casing coming out of Notion. */}
                  <div className="flex flex-wrap gap-2">
                    {(post.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="border border-ink/25 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted transition-colors duration-300 group-hover:border-ink group-hover:bg-surface group-hover:text-ink"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default Writing;
