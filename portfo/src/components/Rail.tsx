import { Link, useLocation } from "react-router-dom";
import { NAV_KEYS, ROUTES, activeRouteIndex } from "../lib/nav";

/**
 * Replaces the header. On desktop it's a hairline rail on the left edge that
 * marks position; on touch it collapses to a compact bottom bar, since keyboard
 * navigation isn't available there and the dots still need to be reachable.
 */
export default function Rail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { pathname } = useLocation();
  // Sub-routes count as their section, so reading a post keeps "thoughts" marked.
  const activeIndex = activeRouteIndex(pathname);

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Sections"
        className="fixed left-8 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      >
        <div className="relative flex flex-col gap-7">
          <span
            aria-hidden
            className="absolute left-[3px] top-1 bottom-1 w-px bg-ink/12"
          />
          {ROUTES.map((route, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={route.path}
                to={route.path}
                aria-current={active ? "page" : undefined}
                className="group relative flex items-center gap-3"
              >
                <span
                  className={`relative z-10 h-[7px] w-[7px] shrink-0 rounded-full border border-ink transition-all duration-300 ${
                    active
                      ? "scale-125 bg-ink"
                      : "bg-stone group-hover:bg-ink/30"
                  }`}
                />
                <span
                  className={`whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
                    active
                      ? "translate-x-0 text-ink opacity-100"
                      : "-translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {route.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Keyboard legend */}
      <button
        onClick={onOpenPalette}
        aria-label="Open command palette"
        className="fixed bottom-7 right-8 z-50 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-subtle transition-colors hover:text-ink lg:block"
      >
        {NAV_KEYS[0]}–{NAV_KEYS[NAV_KEYS.length - 1]} · j/k ·{" "}
        <span className="text-muted">⌘K</span>
      </button>

      {/* Touch fallback */}
      <nav
        aria-label="Sections"
        className="fixed bottom-0 left-0 z-50 w-full border-t border-ink/10 bg-stone/90 backdrop-blur-sm lg:hidden"
      >
        <div className="relative flex">
          <span
            aria-hidden
            className="absolute bottom-0 h-px bg-ink transition-transform duration-300 ease-out"
            style={{
              width: `${100 / ROUTES.length}%`,
              transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
              opacity: activeIndex < 0 ? 0 : 1,
            }}
          />
          {ROUTES.map((route, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={route.path}
                to={route.path}
                aria-current={active ? "page" : undefined}
                className={`flex-1 py-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  active ? "text-ink" : "text-subtle"
                }`}
              >
                {route.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
