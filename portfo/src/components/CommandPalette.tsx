import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, socials } from "../lib/nav";
import { jobs } from "../data/jobs";
import { projects } from "../data/projects";
import postsData from "../data/blog-posts.json";

type Post = { title: string; slug: string; description: string; tags: string[] };

type Item = {
  id: string;
  label: string;
  hint: string;
  kind: string;
  to?: string;
  href?: string;
  keywords?: string;
};

const posts = (postsData as Post[]) || [];

const ITEMS: Item[] = [
  ...ROUTES.map((r) => ({
    id: `route:${r.path}`,
    label: r.label,
    hint: r.hint,
    kind: "page",
    to: r.path,
  })),
  ...jobs.map((j) => ({
    id: `job:${j.id}`,
    label: `${j.company} · ${j.role}`,
    hint: j.description,
    kind: "role",
    href: j.companyUrl,
    keywords: `${j.location} ${j.date} ${j.tech.join(" ")}`,
  })),
  ...projects.map((p) => ({
    id: `project:${p.id}`,
    label: p.title,
    hint: p.description,
    kind: "project",
    href: p.website || p.demo || p.github,
    keywords: p.tech.join(" "),
  })),
  ...posts.map((p) => ({
    id: `post:${p.slug}`,
    label: p.title,
    hint: p.description,
    kind: "writing",
    to: `/writing/${p.slug}`,
    keywords: (p.tags || []).join(" "),
  })),
  ...socials.map((s) => ({
    id: `social:${s.label}`,
    label: s.label.toLowerCase(),
    hint: s.href.replace(/^https?:\/\/|^mailto:/, ""),
    kind: "link",
    href: s.href,
  })),
];

/** Subsequence match, rewarding consecutive runs and word-start hits. */
function score(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let s = 0;
  let prev = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] !== q[qi]) continue;
    s += i === prev + 1 ? 6 : 1;
    if (i === 0 || /[\s\-_/@.·]/.test(t[i - 1])) s += 4;
    prev = i;
    qi++;
  }
  return qi === q.length ? s - t.length * 0.04 : null;
}

/** Mounted only while open, so its state starts fresh on every invocation. */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return ITEMS.slice(0, 8);
    return ITEMS.map((item) => {
      const hay = `${item.label} ${item.kind} ${item.keywords ?? ""}`;
      const direct = score(query.trim(), hay);
      const viaHint = score(query.trim(), item.hint);
      const best =
        direct === null
          ? viaHint === null
            ? null
            : viaHint - 8
          : Math.max(direct, viaHint === null ? -Infinity : viaHint - 8);
      return { item, best };
    })
      .filter((r): r is { item: Item; best: number } => r.best !== null)
      .sort((a, b) => b.best - a.best)
      .slice(0, 8)
      .map((r) => r.item);
  }, [query]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // aria-modal claims the rest of the page is inert, but nothing enforced that:
  // Tab walked straight out into the links behind the scrim. Cycle focus within
  // the dialog instead, and hand it back where it came from on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || !root.contains(at))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab, true);
    return () => {
      document.removeEventListener("keydown", onTab, true);
      opener?.focus?.();
    };
  }, []);

  // Arrowing past the visible window left the highlight off-screen.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (item: Item) => {
    onClose();
    if (item.to) navigate(item.to);
    else if (item.href?.startsWith("mailto:")) window.location.assign(item.href);
    else if (item.href) window.open(item.href, "_blank", "noopener,noreferrer");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) run(item);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/15 px-4 pt-[14vh] backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl border border-ink bg-surface shadow-[6px_6px_0_0_var(--color-ink)]"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-4">
          <span className="font-mono text-xs text-subtle">▸</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="jump to anything…"
            aria-label="Search"
            role="combobox"
            aria-expanded
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            className="w-full bg-transparent py-4 font-mono text-sm text-ink outline-none placeholder:text-subtle"
          />
          <kbd className="font-mono text-[10px] uppercase tracking-wider text-subtle">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="palette-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[52vh] overflow-y-auto py-2"
        >
          {results.length === 0 && (
            <p className="px-4 py-6 text-center font-mono text-xs text-subtle">
              nothing matches “{query}”
            </p>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              id={`palette-${item.id}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              tabIndex={-1}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(item)}
              className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors ${
                i === active ? "bg-ink/5" : ""
              }`}
            >
              <span
                aria-hidden
                className={`font-mono text-xs ${i === active ? "text-ink" : "text-transparent"}`}
              >
                →
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-muted">{item.hint}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-subtle">
                {item.kind}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-ink/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-subtle">
          <span>↑↓ move</span>
          <span>⏎ open</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
