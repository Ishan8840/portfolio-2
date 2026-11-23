/** Publish local Markdown into the site's generated index and article files. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function syncWriting(root = projectRoot) {
  const source = path.join(root, "content/writing");
  function walk(directory) {
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .flatMap((entry) => {
        const full = path.join(directory, entry.name);
        return entry.isDirectory()
          ? walk(full)
          : entry.isFile() && entry.name.endsWith(".md")
            ? [full]
            : [];
      });
  }
  // Validate every source and link before touching the last successful output.
  const articles = walk(source)
    .sort()
    .flatMap((file) => {
      const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
      if (!match) throw new Error(`${file}: expected YAML frontmatter`);
      const meta = parse(match[1]);
      if (!meta || typeof meta !== "object")
        throw new Error(`${file}: invalid frontmatter`);
      if (meta.draft === true) return [];
      for (const field of ["title", "date", "description"]) {
        if (typeof meta[field] !== "string" || !meta[field].trim())
          throw new Error(`${file}: ${field} must be a nonempty string`);
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(meta.date) ||
        !Number.isFinite(Date.parse(meta.date)) ||
        new Date(meta.date).toISOString().slice(0, 10) !== meta.date
      )
        throw new Error(`${file}: use a valid YYYY-MM-DD date`);
      const slug = meta.slug ?? slugify(path.basename(file, ".md"));
      if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        throw new Error(`${file}: invalid slug`);
      const tags = meta.tags ?? [];
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))
        throw new Error(`${file}: tags must be a list of strings`);
      const body = match[2].trim() + "\n";
      return [
        {
          file,
          body,
          meta: {
            id: slug,
            title: meta.title,
            slug,
            date: meta.date,
            description: meta.description,
            tags,
            readTime: `${Math.max(1, Math.ceil(body.split(/\s+/).length / 220))} mins`,
          },
        },
      ];
    });
  const slugs = new Set();
  const aliases = new Map();
  for (const article of articles) {
    if (slugs.has(article.meta.slug))
      throw new Error(`Duplicate slug: ${article.meta.slug}`);
    slugs.add(article.meta.slug);
    for (const alias of [
      path.basename(article.file, ".md"),
      article.meta.title,
      article.meta.slug,
    ]) {
      const key = alias.toLowerCase();
      if (aliases.has(key) && aliases.get(key) !== article.meta.slug)
        throw new Error(`Ambiguous note name: ${alias}`);
      aliases.set(key, article.meta.slug);
    }
  }
  for (const article of articles) {
    article.body = article.body
      .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g)
      .map((part, index) =>
        index % 2
          ? part
          : part.replace(/\[\[([^\]]+)\]\]/g, (_, reference) => {
              const [target, label] = reference.split("|");
              const [note, heading] = target.split("#");
              const name = path.posix.basename(note.replace(/\.md$/i, ""));
              const slug = aliases.get(name.toLowerCase());
              if (!slug)
                throw new Error(
                  `${article.file}: unresolved note link [[${reference}]]`,
                );
              // Headings aren't assigned IDs by the current renderer; avoid broken fragments.
              if (heading)
                throw new Error(
                  `${article.file}: use a whole-note link instead of a heading wikilink`,
                );
              const text = (label ?? name).replace(/[\[\]]/g, "\\$&");
              return `[${text}](/writing/${slug})`;
            }),
      )
      .join("");
  }
  articles.sort(
    (a, b) =>
      b.meta.date.localeCompare(a.meta.date) ||
      a.meta.title.localeCompare(b.meta.title),
  );
  const output = path.join(root, "public/posts");
  const index = path.join(root, "src/data/blog-posts.json");
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(path.dirname(index), { recursive: true });
  const write = (file, text) => {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text)
      fs.writeFileSync(file, text);
  };
  for (const article of articles)
    write(path.join(output, `${article.meta.slug}.md`), article.body);
  for (const name of fs.readdirSync(output))
    if (name.endsWith(".md") && !slugs.has(name.slice(0, -3)))
      fs.unlinkSync(path.join(output, name));
  write(
    index,
    JSON.stringify(
      articles.map((article) => article.meta),
      null,
      2,
    ) + "\n",
  );
  return articles.length;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(`Writing: ${syncWriting()} local articles synced`);
}
