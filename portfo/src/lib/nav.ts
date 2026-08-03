export type Route = { path: string; label: string; hint: string };

/** Order matters: index + 1 is the number key, and j/k walk this list. */
export const ROUTES: Route[] = [
  { path: "/", label: "home", hint: "who I am" },
  { path: "/experience", label: "journey", hint: "where I've worked" },
  { path: "/projects", label: "creations", hint: "what I've built" },
  { path: "/writing", label: "thoughts", hint: "what I've written" },
];

export const socials = [
  { label: "Twitter", href: "https://x.com/IshanShahh", icon: "/imgs/x.svg" },
  { label: "GitHub", href: "https://github.com/Ishan8840", icon: "/imgs/github.svg" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ishahh", icon: "/imgs/linkedin.svg" },
  { label: "Email", href: "mailto:i9shah@uwaterloo.ca", icon: "/imgs/email.svg" },
];
