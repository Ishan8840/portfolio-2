import { Link, useLocation } from "react-router-dom";
import { ROUTES, activeRouteIndex } from "../lib/nav";

const labels = ['Home', 'Experience', 'Projects', 'Writing'];

export default function Rail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { pathname } = useLocation();
  const active = activeRouteIndex(pathname);
  return <header className="site-header">
    <Link to="/" className="site-name" aria-current={active === 0 ? 'page' : undefined}>Ishan Shah</Link>
    <nav aria-label="Main navigation">{ROUTES.map((route, i) => route.path === "/" ? null : <Link key={route.path} to={route.path} aria-current={active === i ? 'page' : undefined}>{labels[i]}</Link>)}</nav>
    <button className="search-trigger" onClick={onOpenPalette} aria-label="Open command palette" title="Search (⌘K or Ctrl+K)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
  </header>;
}
