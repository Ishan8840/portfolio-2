/** Static article heads for crawlers, and matching PNG share cards. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const posts = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/blog-posts.json"), "utf8"),
);
const template = fs.readFileSync(path.join(output, "index.html"), "utf8");
const site = "https://ishanshah.org";
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function lines(text, limit) {
  const result = [""];
  for (const word of text.split(/\s+/)) {
    const last = result.length - 1;
    if (result[last] && result[last].length + word.length + 1 > limit)
      result.push(word);
    else result[last] += (result[last] ? " " : "") + word;
  }
  return result;
}
fs.mkdirSync(path.join(output, "writing"), { recursive: true });
fs.mkdirSync(path.join(output, "social"), { recursive: true });
for (const post of posts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug))
    throw new Error(`Invalid article slug: ${post.slug}`);
  const titleLines = lines(post.title, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#f8f9f7"/>
    <rect x="80" y="82" width="32" height="5" rx="2" fill="#6c8269"/>
    <g font-family="DejaVu Sans" fill="#69716e">
      <text x="80" y="138" font-size="25">Ishan Shah / Writing</text>
      ${titleLines.map((line, i) => `<text x="76" y="${250 + i * 70}" font-size="53" fill="#24302c">${escape(line)}</text>`).join("")}
      <text x="80" y="535" font-size="23">${escape(post.date)} · ${escape(post.readTime)} read</text>
      <text x="1120" y="535" text-anchor="end" font-size="23">ishanshah.org</text>
    </g>
  </svg>`;
  const renderer = new Resvg(svg, {
    font: {
      fontFiles: [path.join(root, "scripts/assets/DejaVuSans.ttf")],
      loadSystemFonts: false,
    },
  });
  fs.writeFileSync(
    path.join(output, "social", `${post.slug}.png`),
    renderer.render().asPng(),
  );
  const url = `${site}/writing/${post.slug}`;
  const image = `${site}/social/${post.slug}.png`;
  const title = `${post.title} — Ishan Shah`;
  const meta = [
    `<title>${escape(title)}</title>`,
    `<link rel="canonical" href="${url}" />`,
    ...[
      ["name", "description", post.description],
      ["property", "og:type", "article"],
      ["property", "og:title", title],
      ["property", "og:description", post.description],
      ["property", "og:url", url],
      ["property", "og:site_name", "Ishan Shah"],
      ["property", "og:image", image],
      ["property", "og:image:width", "1200"],
      ["property", "og:image:height", "630"],
      ["property", "og:image:alt", post.title],
      ["property", "article:published_time", post.date],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", post.description],
      ["name", "twitter:image", image],
      ["name", "twitter:image:alt", post.title],
    ].map(
      ([key, name, value]) =>
        `<meta ${key}="${name}" content="${escape(value)}" />`,
    ),
  ].join("\n    ");
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(
      /<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>/g,
      "",
    )
    .replace("</head>", `${meta}\n  </head>`);
  fs.writeFileSync(path.join(output, "writing", `${post.slug}.html`), html);
}
console.log(`Article previews: ${posts.length} static heads and PNG cards`);
