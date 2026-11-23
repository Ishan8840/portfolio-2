import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncWriting } from "./sync-writing.js";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-writing-"));
  fs.mkdirSync(path.join(root, "content/writing/Series"), { recursive: true });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const note = (name, body, extra = "") =>
    fs.writeFileSync(
      path.join(root, "content/writing/Series", `${name}.md`),
      `---\ntitle: "${name}"\ndate: "2026-08-05"\ndescription: "About ${name}"\n${extra}---\n# ${name}\n\n${body}\n`,
    );
  return {
    root,
    note,
    read: () =>
      JSON.parse(
        fs.readFileSync(path.join(root, "src/data/blog-posts.json"), "utf8"),
      ),
  };
}

test("publishes nested notes with stable slugs, strips metadata and resolves vault links", (t) => {
  const { root, note, read } = fixture(t);
  note(
    "First",
    "See [[Writing/Series/Second|the other article]].\n\n`[[Not a link]]`",
    'slug: "old-url"\ntags: [vla]\n',
  );
  note("Second", "Article body.");
  assert.equal(syncWriting(root), 2);
  assert.equal(read()[0].slug, "old-url");
  assert.deepEqual(read()[0].tags, ["vla"]);
  const output = fs.readFileSync(
    path.join(root, "public/posts/old-url.md"),
    "utf8",
  );
  assert(output.includes("[the other article](/writing/second)"));
  assert(output.includes("`[[Not a link]]`"));
  assert(!output.includes("slug:"));
  const before = JSON.stringify(read());
  syncWriting(root);
  assert.equal(JSON.stringify(read()), before);
});

test("removes deleted and draft articles from both index and generated files", (t) => {
  const { root, note, read } = fixture(t);
  note("First", "A");
  note("Second", "B");
  syncWriting(root);
  note("Second", "B", "draft: true\n");
  fs.unlinkSync(path.join(root, "content/writing/Series/First.md"));
  syncWriting(root);
  assert.deepEqual(read(), []);
  assert.deepEqual(fs.readdirSync(path.join(root, "public/posts")), []);
});

test("rejects invalid dates, duplicate slugs, and unresolved links before replacing output", (t) => {
  const { root, note, read } = fixture(t);
  note("First", "Original");
  syncWriting(root);
  const original = read();
  note("Second", "Bad link [[Missing]]");
  assert.throws(() => syncWriting(root), /unresolved/);
  assert.deepEqual(read(), original);
  note("Second", "Duplicate", 'slug: "first"\n');
  assert.throws(() => syncWriting(root), /Duplicate slug/);
  note("Second", "Valid");
  const file = path.join(root, "content/writing/Series/Second.md");
  fs.writeFileSync(
    file,
    fs.readFileSync(file, "utf8").replace("2026-08-05", "2026-02-30"),
  );
  assert.throws(() => syncWriting(root), /valid YYYY-MM-DD/);
  assert.deepEqual(read(), original);
});
