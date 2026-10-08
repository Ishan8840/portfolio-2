import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type PointerEvent,
} from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import AboutMe from "./pages/About";
import Experience from "./pages/Experience";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import MusicProvider from "./components/MusicProvider";
import MusicAtmosphere from "./components/MusicAtmosphere";
import Rail from "./components/Rail";
import posts from "./data/blog-posts.json";
import CursorTrail from "./components/CursorTrail";
import { NAV_KEYS, ROUTES, activeRouteIndex } from "./lib/nav";

// Load the markdown renderer only when opening an article.
const CommandPalette = lazy(() => import("./components/CommandPalette"));
const PostDetail = lazy(() => import("./pages/PostDetail"));

const HOVER_COLORS = [
  "#426c98",
  "#66784e",
  "#98624f",
  "#806293",
  "#956077",
  "#49756f",
];

function randomizeLinkHover(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType === "touch" || !(event.target instanceof Element))
    return;
  const link = event.target.closest("a");
  if (!link) return;
  // Moving between a link's text, icon, and video should keep the same color.
  if (event.relatedTarget instanceof Node && link.contains(event.relatedTarget))
    return;
  const previous = link.style.getPropertyValue("--color-link-hover");
  const choices = HOVER_COLORS.filter((color) => color !== previous);
  link.style.setProperty(
    "--color-link-hover",
    choices[Math.floor(Math.random() * choices.length)],
  );
}

function isTyping(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const post = posts.find(
      (post) => location.pathname === `/writing/${post.slug}`,
    );
    const section = ROUTES.find((route) => route.path === location.pathname);
    const label = post?.title ?? section?.label ?? "Page not found";
    document.title =
      location.pathname === "/" ? "Ishan Shah" : `${label} — Ishan Shah`;
  }, [location.pathname]);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K works even from inside the palette's own input.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (
        paletteOpen ||
        isTyping(e.target) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;

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
    <MusicProvider>
      <div className="site-shell" onPointerOver={randomizeLinkHover}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Rail onOpenPalette={openPalette} />
        <CursorTrail />
        <MusicAtmosphere />
        {paletteOpen && (
          <Suspense fallback={null}>
            <CommandPalette onClose={() => setPaletteOpen(false)} />
          </Suspense>
        )}

        <main id="main-content" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="page" role="status">
                Loading article…
              </div>
            }
          >
            <div key={location.pathname} className="page-transition">
              <Routes>
                <Route path="/" element={<AboutMe />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/writing" element={<Writing />} />
                <Route
                  path="/writing/:slug"
                  element={<PostDetail key={location.pathname} />}
                />
                <Route
                  path="*"
                  element={
                    <div className="page page-message">
                      <h1>Page not found</h1>
                      <p>There’s nothing at this address.</p>
                      <Link to="/">← Back home</Link>
                    </div>
                  }
                />
              </Routes>
            </div>
          </Suspense>
        </main>
        <Analytics />
      </div>
    </MusicProvider>
  );
}

export default App;
