import type { ComponentProps } from "react";
import { Link } from "react-router-dom";

/** Keep local project/article navigation inside the app. */
export default function SiteLink({
  href = "/",
  children,
  ...props
}: ComponentProps<"a">) {
  if (href.startsWith("/") && !href.startsWith("//"))
    return (
      <Link {...props} to={href}>
        {children}
      </Link>
    );
  if (href.startsWith("#"))
    return (
      <a {...props} href={href}>
        {children}
      </a>
    );
  return (
    <a
      {...props}
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
