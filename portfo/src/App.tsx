import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import AboutMe from "./pages/About";
import Experience from "./pages/Experience";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import PostDetail from "./pages/PostDetail";
import Rail from "./components/Rail";
import CommandPalette from "./components/CommandPalette";
import AmbientAudio from "./components/AmbientAudio";
import DiffusionTransition from "./components/DiffusionTransition";
import { ROUTES } from "./lib/nav";

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

      const index = ROUTES.findIndex((r) => r.path === location.pathname);

      if (e.key >= "1" && e.key <= String(ROUTES.length)) {
        e.preventDefault();
        navigate(ROUTES[Number(e.key) - 1].path);
      } else if (e.key === "j" || e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        navigate(ROUTES[(Math.max(index, 0) + 1) % ROUTES.length].path);
      } else if (e.key === "k" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const from = index < 0 ? 0 : index;
        navigate(ROUTES[(from - 1 + ROUTES.length) % ROUTES.length].path);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, location.pathname, paletteOpen]);

  return (
    <div className="bg-stone">
      <Rail onOpenPalette={openPalette} />
      <AmbientAudio />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <DiffusionTransition location={location}>
        {(displayed) => (
          <Routes location={displayed}>
            <Route path="/" element={<AboutMe />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/writing/:slug" element={<PostDetail />} />
            <Route
              path="*"
              element={
                <div className="flex min-h-screen items-center justify-center font-mono text-sm text-muted">
                  404 — press ⌘K
                </div>
              }
            />
          </Routes>
        )}
      </DiffusionTransition>
    </div>
  );
}

export default App;
