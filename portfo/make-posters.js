/** Generate curated, consistently sized video posters: npm run posters. */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const videos = path.join(root, "public/videos");
const posters = path.join(root, "public/posters");

// Choose moments that explain the project before a visitor starts the clip.
const posterFrames = {
  "sharpa.mp4": 12.7, // Robot presenting the completed paper airplane.
  "coffee.mp4": 19.5, // Both arms working together at the espresso machine.
  "fold.mp4": 7, // Gripper and garment visible in both camera views.
};

fs.mkdirSync(posters, { recursive: true });

const clips = fs.readdirSync(videos).filter((f) => f.endsWith(".mp4"));
if (!clips.length) {
  console.log("no clips in public/videos");
  process.exit(0);
}

for (const clip of clips) {
  const out = path.join(posters, clip.replace(/\.mp4$/, ".webp"));
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(posterFrames[clip] ?? 0),
    "-i",
    path.join(videos, clip),
    "-frames:v",
    "1",
    "-vf",
    "scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1",
    "-quality",
    "82",
    out,
  ]);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`${clip} -> posters/${path.basename(out)}  ${kb}kB`);
}
