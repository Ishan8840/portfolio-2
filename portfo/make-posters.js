/**
 * Generate a poster for every clip in public/videos from its own first frame.
 *
 * The <video> elements use preload="none", so without a poster they render an
 * empty box until hovered — but preload="metadata" costs the entire file
 * (measured: 15.6MB across the three clips, because the browser fetches the
 * whole resource rather than just the header). A frame-0 still gives the same
 * "paused video" look for ~30kB and, being taken from the clip itself, can
 * never disagree with it on framing or aspect ratio.
 *
 * Run after adding or replacing a video:  npm run posters
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const videos = path.join(root, "public/videos");
const posters = path.join(root, "public/posters");

fs.mkdirSync(posters, { recursive: true });

const clips = fs.readdirSync(videos).filter((f) => f.endsWith(".mp4"));
if (!clips.length) {
  console.log("no clips in public/videos");
  process.exit(0);
}

for (const clip of clips) {
  const out = path.join(posters, clip.replace(/\.mp4$/, ".webp"));
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", path.join(videos, clip),
    "-frames:v", "1",      // the very first frame, so it matches a paused video
    "-quality", "82",
    out,
  ]);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`${clip} -> posters/${path.basename(out)}  ${kb}kB`);
}
