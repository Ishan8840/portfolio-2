import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import AboutMe from "./pages/About";
import Experience from "./pages/Experience";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import Rail from "./components/Rail";
import CommandPalette from "./components/CommandPalette";
import CursorTrail from "./components/CursorTrail";
import { NAV_KEYS, ROUTES, activeRouteIndex } from "./lib/nav";

// Load the markdown renderer only when opening an article.
const PostDetail = lazy(() => import("./pages/PostDetail"));

function isTyping(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K works even from inside the palette's own input.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (paletteOpen || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      const index = activeRouteIndex(location.pathname);

      // Lookup rather than a range compare: `e.key <= String(ROUTES.length)`
      // compares strings, so a tenth route would make "5" <= "10" false.
      const numbered = NAV_KEYS.indexOf(e.key);
      if (numbered >= 0) {
        e.preventDefault();
        navigate(ROUTES[numbered].path);
      } else if (e.key === "j") {
        e.preventDefault();
        navigate(ROUTES[(Math.max(index, 0) + 1) % ROUTES.length].path);
      } else if (e.key === "k") {
        e.preventDefault();
        const from = index < 0 ? 0 : index;
        navigate(ROUTES[(from - 1 + ROUTES.length) % ROUTES.length].path);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, location.pathname, paletteOpen]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Rail onOpenPalette={openPalette} />
      <CursorTrail />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <main id="main-content">
        <Suspense fallback={<div className="page" role="status">Loading article…</div>}>
            <Routes>
              <Route path="/" element={<AboutMe />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/writing" element={<Writing />} />
              <Route path="/writing/:slug" element={<PostDetail key={location.pathname} />} />
              <Route
                path="*"
                element={
                  <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted">
                    404 — press ⌘K
                  </div>
                }
              />
            </Routes>
          </Suspense>
      </main>
      <Analytics />
    </div>
  );
}

export default App;
