export type Route = { path: string; label: string; hint: string };

/** Order matters: index + 1 is the number key, and j/k walk this list. */
export const ROUTES: Route[] = [
  { path: "/", label: "home", hint: "who I am" },
  { path: "/experience", label: "journey", hint: "where I've worked" },
  { path: "/projects", label: "creations", hint: "what I've built" },
  { path: "/writing", label: "thoughts", hint: "what I've written" },
];

/**
 * The number keys that select a route. Capped at 9 because the handler compares
 * single characters — a tenth route would need "10", which no keypress produces.
 * Derived here so the key handler, the rail legend and the click tick can't
 * drift apart as routes are added.
 */
export const NAV_KEYS = ROUTES.slice(0, 9).map((_, i) => String(i + 1));

/**
 * Which nav entry a path belongs to, counting sub-routes as their section, so
 * reading /writing/some-post still marks "thoughts" as current. Longest match
 * wins; "/" only matches itself.
 */
export function activeRouteIndex(pathname: string): number {
  let best = -1;
  let bestLen = -1;
  ROUTES.forEach((route, i) => {
    const match =
      route.path === "/"
        ? pathname === "/"
        : pathname === route.path || pathname.startsWith(`${route.path}/`);
    if (match && route.path.length > bestLen) {
      best = i;
      bestLen = route.path.length;
    }
  });
  return best;
}

export const socials = [
  { label: "Twitter", href: "https://x.com/IshanShahh", icon: "/imgs/x.svg" },
  { label: "GitHub", href: "https://github.com/Ishan8840", icon: "/imgs/github.svg" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ishahh", icon: "/imgs/linkedin.svg" },
  { label: "Email", href: "mailto:i9shah@uwaterloo.ca", icon: "/imgs/email.svg" },
];
