/**
 * Generate public/sitemap.xml and public/robots.txt.
 *
 * Routes are read out of src/lib/nav.ts and posts out of the generated
 * blog-posts.json, so adding either keeps the sitemap correct without a second
 * list to maintain. Runs as part of `npm run build`.
 *
 * Output is deterministic — no build timestamp — so rebuilding an unchanged
 * site produces no git diff. Posts carry their own date as <lastmod>; the
 * static pages carry none rather than a date that would churn every build.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SITE = "https://ishanshah.org";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// Cheap parse rather than importing TypeScript: this only needs the paths.
const routes = [...read("src/lib/nav.ts").matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
if (!routes.length) throw new Error("no routes found in src/lib/nav.ts");

let posts = [];
try {
  posts = JSON.parse(read("src/data/blog-posts.json"));
} catch {
  console.warn("no blog-posts.json — sitemap will list routes only");
}

const iso = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : null);

const urls = [
  ...routes.map((r) => ({ loc: SITE + r, priority: r === "/" ? "1.0" : "0.8" })),
  ...posts
    .filter((p) => p.slug)
    .map((p) => ({
      loc: `${SITE}/writing/${p.slug}`,
      lastmod: iso(p.date),
      priority: "0.6",
    })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((u) =>
    [
      "  <url>",
      `    <loc>${u.loc}</loc>`,
      u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
      `    <priority>${u.priority}</priority>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")
  ),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
fs.writeFileSync(
  path.join(root, "public/robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
);

console.log(`sitemap.xml: ${routes.length} routes + ${posts.length} posts`);
