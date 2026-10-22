import type { MusicPalette, RGB } from "./music-palette";
import { turtleClicks } from "./click-effects";

/** Procedural turtle silhouettes sampled onto an upright ASCII grid.
 * Inspired by the rendering approach in github.com/stackedlol/ascii-sharks;
 * turtle geometry, shading and movement are implemented here independently.
 */
const DASH_DURATION = 4;
const SHIMMER_DURATION = 1.7;

type TurtleAppearance = {
  bodyLength: number;
  bodyWidth: number;
  flipperLength: number;
  flipperWidth: number;
  strokeRate: number;
  shell: [number, number, number];
  skin: [number, number, number];
};

type Turtle = {
  x: number;
  y: number;
  heading: number;
  phase: number;
  strokeVelocity?: number;
  size: number;
  speed: number;
  velocity: number;
  turnSpeed: number;
  avoidanceSide?: number;
  steeringSide?: number;
  steeringHoldUntil?: number;
  wander: number;
  wanderTarget: number;
  wanderAt: number;
  pace: number;
  paceTarget: number;
  appearance: TurtleAppearance;
};
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const TEXTURE_SIZE = 192;
const MODEL_SCALE = 72;

// A deliberate power stroke, a slower recovery, then an extended glide.
function swimStroke(phase: number) {
  const cycle = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
  const ease = (t: number) => t * t * (3 - 2 * t);
  if (cycle < 0.28)
    return {
      sweep: ease(cycle / 0.28),
      thrust: Math.sin((cycle / 0.28) * Math.PI),
    };
  if (cycle < 0.7) return { sweep: 1 - ease((cycle - 0.28) / 0.42), thrust: 0 };
  return { sweep: 0, thrust: 0 };
}

function pigment(color: [number, number, number], light: number) {
  return `rgb(${color.map((channel) => Math.round(clamp(channel * light, 0, 255))).join(",")})`;
}

/** Draw curved anatomy first, then sample it into ASCII cells. Head points right. */
function createTurtleTexture() {
  const surface = document.createElement("canvas");
  surface.width = surface.height = TEXTURE_SIZE;
  const g = surface.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  const shell = new Path2D(
    "M .53 0 C .54 -.27 .23 -.46 -.13 -.45 C -.44 -.44 -.66 -.22 -.64 0 C -.66 .22 -.44 .44 -.13 .45 C .23 .46 .54 .27 .53 0 Z",
  );
  const rear = new Path2D(
    "M 0 0 C -.12 .04 -.36 .21 -.36 .38 C -.35 .46 -.16 .36 -.04 .24 C .04 .16 .05 .07 0 0 Z",
  );
  const plates = [
    [
      [0.46, 0],
      [0.34, -0.14],
      [0.12, -0.14],
      [0.04, 0],
      [0.12, 0.14],
      [0.34, 0.14],
    ],
    [
      [0.04, 0],
      [0.12, -0.14],
      [-0.12, -0.18],
      [-0.3, -0.1],
      [-0.3, 0.1],
      [-0.12, 0.18],
      [0.12, 0.14],
    ],
    [
      [-0.3, -0.1],
      [-0.46, -0.15],
      [-0.57, 0],
      [-0.46, 0.15],
      [-0.3, 0.1],
    ],
  ];
  const tail = new Path2D(
    "M -.54 -.045 Q -.72 -.05 -.80 0 Q -.72 .05 -.54 .045 Z",
  );
  const head = new Path2D(
    "M .42 -.10 Q .57 -.08 .63 -.13 C .73 -.22 .93 -.15 .94 -.03 Q .96 .10 .81 .16 Q .69 .18 .60 .10 L .42 .10 Z",
  );
  return (
    phase: number,
    heading: number,
    appearance: TurtleAppearance,
    turn: number,
  ) => {
    const stroke = swimStroke(phase);
    const roll = Math.sin(phase - 0.45) * 0.085 + turn * 0.42;
    const pitch = swimStroke(phase - 0.35).thrust * 0.025;
    const lightAngle = -2.2 - heading;
    const lightX = Math.cos(lightAngle) * 0.3;
    const lightY = Math.sin(lightAngle) * 0.3 + roll;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    g.translate(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);
    g.scale(MODEL_SCALE, MODEL_SCALE);
    g.rotate(heading + turn * 0.12 + Math.sin(phase - 0.4) * 0.012);
    g.scale(
      appearance.bodyLength * (1 - pitch),
      appearance.bodyWidth * Math.cos(roll),
    );
    g.lineWidth = 0.025;
    g.lineJoin = "round";
    g.strokeStyle = pigment(appearance.skin, 0.55);
    // Long, curved foreflippers pivot at the shoulders, with small rear rudders.
    for (const side of [-1, 1]) {
      g.save();
      g.scale(1, side);
      g.translate(0.25, 0.27);
      const paddlePhase = phase + side * (0.07 + turn * 0.65);
      const paddle = swimStroke(paddlePhase);
      const trailing = swimStroke(paddlePhase - 0.42).sweep;
      const bend = (trailing - paddle.sweep) * 0.28;
      // The tip lags behind the shoulder through the stroke, like a flexible fin.
      const front = new Path2D(
        `M 0 0 C .20 .12 .25 .38 ${0.06 + bend} .76 C ${0.01 + bend} .87 ${-0.1 + bend} .91 ${-0.1 + bend} .79 C ${-0.1 + bend * 0.5} .59 -.18 .28 -.15 .05 Z`,
      );
      g.rotate(-0.42 + paddle.sweep * 0.94 + side * turn * 0.22);
      g.scale(
        appearance.flipperWidth * (1 - paddle.thrust * 0.14),
        appearance.flipperLength * (1 - paddle.sweep * 0.28),
      );
      const skinLight = g.createLinearGradient(-0.15, 0, 0.18, 0.85);
      const exposure =
        1 + Math.sin(lightAngle) * side * 0.12 - paddle.sweep * 0.16;
      skinLight.addColorStop(0, pigment(appearance.skin, 1.3 * exposure));
      skinLight.addColorStop(1, pigment(appearance.skin, 0.78 * exposure));
      g.fillStyle = skinLight;
      g.fill(front);
      g.stroke(front);
      g.save();
      g.clip(front);
      g.strokeStyle = pigment(appearance.skin, 0.75);
      g.lineWidth = 0.012;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(-0.15, 0.13 + i * 0.1);
        g.quadraticCurveTo(0.04, 0.1 + i * 0.1, 0.2, 0.2 + i * 0.1);
        g.stroke();
      }
      g.restore();
      g.restore();
      g.save();
      g.scale(1, side);
      g.translate(-0.4, 0.24);
      g.rotate(Math.sin(phase - 0.5) * 0.045 + side * turn * 0.4);
      g.fillStyle = pigment(appearance.skin, 0.95 + side * roll);
      g.fill(rear);
      g.stroke(rear);
      g.restore();
    }
    g.fillStyle = pigment(appearance.skin, 0.85);

    g.fill(tail);
    g.stroke(tail);
    // Short neck and rounded, blunt head, with eyes on both sides.

    const headLight = g.createLinearGradient(0.6, -0.2, 0.9, 0.2);
    headLight.addColorStop(
      0,
      pigment(appearance.skin, 1.25 + Math.cos(lightAngle) * 0.12),
    );
    headLight.addColorStop(1, pigment(appearance.skin, 0.85));
    g.fillStyle = headLight;
    g.fill(head);
    g.stroke(head);
    g.fillStyle = "#252525";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(0.81, side * 0.1, 0.032, 0.024, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.moveTo(0.89, -0.06);
    g.quadraticCurveTo(0.86, 0, 0.89, 0.06);
    g.stroke();
    const dome = g.createRadialGradient(lightX, lightY, 0.03, -0.1, 0, 0.7);
    dome.addColorStop(
      0,
      pigment(appearance.shell, 1.55 + stroke.thrust * 0.06),
    );
    dome.addColorStop(0.55, pigment(appearance.shell, 1.12));
    dome.addColorStop(1, pigment(appearance.shell, 0.68));
    g.strokeStyle = pigment(appearance.shell, 0.55);
    g.fillStyle = dome;
    g.fill(shell);
    g.stroke(shell);
    g.save();
    g.clip(shell);
    g.strokeStyle = pigment(appearance.shell, 0.62);
    g.lineWidth = 0.027;
    for (const plate of plates) {
      g.beginPath();
      plate.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.stroke();
    }
    // Large costal plates, rather than a uniform honeycomb texture.
    for (const side of [-1, 1]) {
      for (const [x, y, outerX, outerY] of [
        [0.34, 0.14, 0.44, 0.3],
        [0.12, 0.14, 0.18, 0.43],
        [-0.12, 0.18, -0.18, 0.44],
        [-0.3, 0.1, -0.44, 0.34],
        [-0.46, 0.15, -0.59, 0.23],
      ]) {
        g.beginPath();
        g.moveTo(x, side * y);
        g.lineTo(outerX, side * outerY);
        g.stroke();
      }
    }
    g.save();
    g.scale(0.89, 0.89);
    g.lineWidth = 0.022;
    g.stroke(shell);
    g.restore();
    // Small plates along the shell's rim.
    for (let i = 0; i < 22; i++) {
      const angle = (i * Math.PI * 2) / 22;
      g.beginPath();
      g.moveTo(-0.06 + Math.cos(angle) * 0.52, Math.sin(angle) * 0.39);
      g.lineTo(-0.06 + Math.cos(angle) * 0.61, Math.sin(angle) * 0.48);
      g.stroke();
    }
    g.restore();
    return g.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE).data;
  };
}

export function startAsciiTurtles(
  canvas: HTMLCanvasElement,
  getPalette: () => MusicPalette | null = () => null,
  isReading: () => boolean = () => false,
) {
  const ctx = canvas.getContext("2d");
  const texture = createTurtleTexture();
  if (!ctx || !texture) return () => {};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: -1000, y: -1000 };
  let width = 0,
    height = 0,
    dpr = 1,
    frame = 0,
    last = 0,
    elapsed = 0;
  let turtles: Turtle[] = [];
  let reaction: {
    index: number;
    start: number;
    nextStroke: number;
    dashDirection: number;
    x: number;
    y: number;
  } | null = null;
  const pigments: { shell: RGB; skin: RGB }[] = [];
  const textureFrames: { pixels: Uint8ClampedArray; at: number }[] = [];
  const glyphMetrics = new Map<string, Map<string, number>>();
  let paletteTime = performance.now();
  let musicStrength = 0;
  let marginPreference = 0;
  const radiusOf = (turtle: Turtle) =>
    turtle.size * (width < 700 ? 0.64 : 1) * 1.3;

  // A final geometric guard keeps fins apart even after resizing or a tight encounter.
  const keepSpace = () => {
    for (let pass = 0; pass < 8; pass++) {
      for (const turtle of turtles) {
        const r = radiusOf(turtle) + 8;
        turtle.x = clamp(turtle.x, r, width - r);
        turtle.y = clamp(turtle.y, r, height - r);
      }
      for (let i = 0; i < turtles.length; i++) {
        for (let j = i + 1; j < turtles.length; j++) {
          const a = turtles[i],
            b = turtles[j];
          const dx = b.x - a.x,
            dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const gap = radiusOf(a) + radiusOf(b) + 10;
          if (distance >= gap) continue;
          const nx = distance > 0.001 ? dx / distance : 1;
          const ny = distance > 0.001 ? dy / distance : 0;
          const push = (gap - distance) * 0.5;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  };

  const resize = () => {
    const previousWidth = width,
      previousHeight = height;
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    if (!turtles.length) {
      turtles = [
        {
          x: width * 0.13,
          y: height * 0.68,
          heading: -0.8,
          phase: 0,
          size: 86,
          speed: 33,
          velocity: 26,
          turnSpeed: 0,
          wander: 0,
          wanderTarget: (Math.random() - 0.5) * 0.4,
          wanderAt: 3 + Math.random() * 5,
          pace: 1,
          paceTarget: 1,
          appearance: {
            bodyLength: 1.03,
            bodyWidth: 1.08,
            flipperLength: 0.9,
            flipperWidth: 1.05,
            strokeRate: 1.8,
            shell: [109, 105, 91],
            skin: [100, 114, 108],
          },
        },
        {
          x: width * 0.87,
          y: height * 0.32,
          heading: 2.3,
          phase: 2,
          size: 76,
          speed: 29,
          velocity: 24,
          turnSpeed: 0,
          wander: 0,
          wanderTarget: (Math.random() - 0.5) * 0.4,
          wanderAt: 3 + Math.random() * 5,
          pace: 1,
          paceTarget: 1,
          appearance: {
            bodyLength: 1.1,
            bodyWidth: 0.88,
            flipperLength: 1.09,
            flipperWidth: 0.86,
            strokeRate: 2.0,
            shell: [83, 116, 112],
            skin: [102, 123, 142],
          },
        },
      ];
    } else {
      for (const turtle of turtles) {
        turtle.x *= width / previousWidth;
        turtle.y *= height / previousHeight;
      }
    }
    keepSpace();
    draw();
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cw = width < 700 ? 3 : 4;
    const ch = cw * 1.5;
    ctx.font = `${Math.round(400 + musicStrength * 150)} ${ch}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let glyphOffsets = glyphMetrics.get(ctx.font);
    if (!glyphOffsets) {
      glyphOffsets = new Map(
        [...".:;itx%#@"].map((glyph) => {
          const metrics = ctx.measureText(glyph);
          return [
            glyph,
            (metrics.actualBoundingBoxAscent -
              metrics.actualBoundingBoxDescent) /
              2,
          ];
        }),
      );
      glyphMetrics.set(ctx.font, glyphOffsets);
    }
    const contentLeft = Math.max(24, (width - 640) / 2);
    const contentRight = width - contentLeft;
    const palette = getPalette();
    const now = performance.now();
    const blend = motion.matches
      ? 1
      : 1 - Math.exp(-Math.min((now - paletteTime) / 1000, 0.1) * 2.5);
    paletteTime = now;
    musicStrength += ((palette ? 1 : 0) - musicStrength) * blend;
    for (const [index, turtle] of turtles.entries()) {
      const colors = (pigments[index] ??= {
        shell: [...turtle.appearance.shell],
        skin: [...turtle.appearance.skin],
      });
      for (const part of ["shell", "skin"] as const) {
        const base = palette?.[index % 2];
        for (let channel = 0; channel < 3; channel++) {
          const target = base
            ? part === "shell"
              ? base[channel] * 0.82
              : base[channel] + (255 - base[channel]) * 0.25
            : turtle.appearance[part][channel];
          colors[part][channel] += (target - colors[part][channel]) * blend;
        }
      }
      const active = reaction?.index === index ? reaction : null;
      const shimmerProgress = active
        ? clamp((elapsed - active.start) / SHIMMER_DURATION, 0, 1)
        : 0;
      const size = turtle.size * (width < 700 ? 0.64 : 1);
      const radius = size * 1.3;
      // Keep translation at display refresh rate; resample anatomy less often at rest.
      let cached = textureFrames[index];
      const fastMotion = active !== null || Math.abs(turtle.turnSpeed) > 0.3;
      if (
        !cached ||
        motion.matches ||
        fastMotion ||
        now - cached.at >= 1000 / 30
      ) {
        cached = {
          pixels: texture(
            turtle.phase,
            turtle.heading,
            { ...turtle.appearance, ...colors },
            turtle.turnSpeed,
          ),
          at: now,
        };
        textureFrames[index] = cached;
      }
      const pixels = cached.pixels;
      const cosHeading = Math.cos(turtle.heading),
        sinHeading = Math.sin(turtle.heading);
      const shimmering = active !== null;
      for (
        let py = turtle.y - Math.ceil(radius / ch) * ch;
        py < Math.min(height, turtle.y + radius);
        py += ch
      ) {
        for (
          let px = turtle.x - Math.ceil(radius / cw) * cw;
          px < Math.min(width, turtle.x + radius);
          px += cw
        ) {
          const tx = Math.floor(
            TEXTURE_SIZE / 2 + ((px - turtle.x) / size) * MODEL_SCALE,
          );
          const ty = Math.floor(
            TEXTURE_SIZE / 2 + ((py - turtle.y) / size) * MODEL_SCALE,
          );
          if (tx < 0 || ty < 0 || tx >= TEXTURE_SIZE || ty >= TEXTURE_SIZE)
            continue;
          const i = (ty * TEXTURE_SIZE + tx) * 4;
          const coverage = pixels[i + 3] / 255;
          if (coverage < 0.15) continue;
          const luminance =
            pixels[i] * 0.2126 +
            pixels[i + 1] * 0.7152 +
            pixels[i + 2] * 0.0722;
          const shade = 1 - luminance / 255;
          const fade = clamp(
            Math.min(px - contentLeft, contentRight - px) / 65,
            0,
            1,
          );
          // A fixed spatial field: passing characters ease in and out without oscillation.
          const cursorDistance = Math.hypot(px - pointer.x, py - pointer.y);
          const proximity = clamp(1 - cursorDistance / 16, 0, 1);
          const illumination = proximity * proximity * (3 - 2 * proximity);
          let glint = 0;
          if (shimmering) {
            const localX =
              ((px - turtle.x) * cosHeading + (py - turtle.y) * sinHeading) /
              size;
            const localY =
              (-(px - turtle.x) * sinHeading + (py - turtle.y) * cosHeading) /
              size;
            const onShell =
              ((localX + 0.06) / 0.6) ** 2 + (localY / 0.44) ** 2 < 1;
            if (onShell)
              glint =
                Math.exp(
                  -(((localX - (0.8 - shimmerProgress * 1.6)) / 0.22) ** 2),
                ) * Math.sin(shimmerProgress * Math.PI);
          }
          const alpha =
            Math.min(
              0.98,
              0.56 -
                fade * 0.23 +
                illumination * 0.18 +
                musicStrength * 0.33 +
                glint * 0.95,
            ) * coverage;
          // Fine ink characters retain the anatomy without heavy mosaic blocks.
          const ramp = ".:;itx%#@";
          const glyphIndex = Math.min(
            ramp.length - 1,
            Math.floor(clamp(shade, 0, 1) * ramp.length),
          );
          const glyph = ramp[glyphIndex];
          // Repel individual glyphs without changing their font, density, or character.
          const push = motion.matches ? 0 : illumination * 12;
          const directionLength = Math.hypot(cursorDistance, 6);
          const x = px + ((px - pointer.x) / directionLength) * push;
          const y = py + ((py - pointer.y) / directionLength) * push;
          const opacity = Math.min(
            1,
            alpha * (0.6 + shade * 0.4) + glint * 0.18 * coverage,
          );
          // Preserve the sweep's contrast even when the album palette is already opaque.
          const ink = 1 - glint * 0.5;
          ctx.fillStyle = `rgba(${Math.round(pixels[i] * ink)}, ${Math.round(pixels[i + 1] * ink)}, ${Math.round(pixels[i + 2] * ink)}, ${opacity})`;
          ctx.fillText(glyph, x, y + (glyphOffsets.get(glyph) ?? 0));
        }
      }
    }
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.065);
    last = now;
    elapsed += dt;
    // Leave narrow screens alone: a full turtle needs enough room to turn.
    const margin = Math.max(0, (width - 640) / 2);
    const hasRoom = margin > Math.max(...turtles.map(radiusOf)) * 2 + 48;
    const readingTarget = isReading() && hasRoom ? 1 : 0;
    marginPreference +=
      (readingTarget - marginPreference) * (1 - Math.exp(-dt * 1.4));
    if (reaction && elapsed - reaction.start >= DASH_DURATION) reaction = null;
    const neighbors = turtles.map((turtle) => ({ ...turtle }));
    turtles.forEach((turtle, index) => {
      // Independent, slowly blended choices avoid a repeating patrol or jittery turns.
      if (elapsed >= turtle.wanderAt) {
        turtle.wanderTarget = (Math.random() - 0.5) * 0.5;
        turtle.paceTarget = 0.85 + Math.random() * 0.3;
        turtle.wanderAt = elapsed + 4 + Math.random() * 7;
      }
      turtle.wander +=
        (turtle.wanderTarget - turtle.wander) * (1 - Math.exp(-dt * 0.45));
      turtle.pace +=
        (turtle.paceTarget - turtle.pace) * (1 - Math.exp(-dt * 0.3));
      let desiredX = Math.cos(turtle.heading + turtle.wander);
      let desiredY = Math.sin(turtle.heading + turtle.wander);
      let speedFactor = 1;
      const age = reaction ? elapsed - reaction.start : 0;
      const dashing = reaction?.index === index;
      if (reaction?.index === index) {
        // Flee the original click position, independent of later cursor movement.
        const awayX = turtle.x - reaction.x;
        const awayY = turtle.y - reaction.y;
        const distance = Math.hypot(awayX, awayY);
        if (distance > 4) {
          desiredX = awayX / distance;
          desiredY = awayY / distance;
        }
        const nearbyThreat = clamp(1 - distance / 220, 0, 1);
        const escape = Math.max(
          5 * Math.exp(-age * 0.85),
          nearbyThreat * 3 * clamp((DASH_DURATION - age) / 1.2, 0, 1),
        );
        speedFactor = 1 + escape;
      }
      const radius = radiusOf(turtle) + 12;
      // Bound prediction so a dash cannot swing the avoidance target across the viewport.
      const lookAhead = clamp(turtle.velocity * 2.5, 60, 120);
      const lookX = turtle.x + Math.cos(turtle.heading) * lookAhead;
      const lookY = turtle.y + Math.sin(turtle.heading) * lookAhead;
      const edgeRange = 80 - marginPreference * 48;
      desiredX +=
        Math.max(0, (radius + edgeRange - lookX) / edgeRange) * 3 -
        Math.max(0, (lookX - width + radius + edgeRange) / edgeRange) * 3;
      desiredY +=
        Math.max(0, (radius + edgeRange - lookY) / edgeRange) * 3 -
        Math.max(0, (lookY - height + radius + edgeRange) / edgeRange) * 3;
      // Treat the text column as a soft inner bank, one swimmer on each side.
      // Existing turn limits carry them there naturally, without repositioning.
      const innerBank = margin - radius - 16;
      const readingPressure =
        index === 0
          ? -Math.max(0, (lookX - innerBank) / 70)
          : Math.max(0, (width - innerBank - lookX) / 70);
      desiredX +=
        clamp(readingPressure, -4, 4) * marginPreference * (dashing ? 0.35 : 1);
      let caution = 0;
      neighbors.forEach((other, otherIndex) => {
        if (otherIndex === index) return;
        const dx = turtle.x - other.x,
          dy = turtle.y - other.y;
        const distance = Math.hypot(dx, dy) || 1;
        const gap = radiusOf(turtle) + radiusOf(other) + 10;
        const vx =
          Math.cos(turtle.heading) * turtle.velocity -
          Math.cos(other.heading) * other.velocity;
        const vy =
          Math.sin(turtle.heading) * turtle.velocity -
          Math.sin(other.heading) * other.velocity;
        const closestTime = clamp(
          -(dx * vx + dy * vy) / (vx * vx + vy * vy || 1),
          0,
          4,
        );
        const predicted = Math.hypot(
          dx + vx * closestTime,
          dy + vy * closestTime,
        );
        const pressure = clamp((gap + 90 - distance) / 90, 0, 1);
        const approaching = clamp((gap + 35 - predicted) / 60, 0, 1);
        const avoid = Math.max(pressure, approaching);
        caution = Math.max(caution, pressure);
        // A consistent sideways component lets head-on swimmers pass each other.
        desiredX += ((dx / distance) * 2.5 - (dy / distance) * 1.3) * avoid;
        desiredY += ((dy / distance) * 2.5 + (dx / distance) * 1.3) * avoid;
      });
      let turn = Math.atan2(
        Math.sin(Math.atan2(desiredY, desiredX) - turtle.heading),
        Math.cos(Math.atan2(desiredY, desiredX) - turtle.heading),
      );
      // Commit to one side of a large avoidance turn. Near 180 degrees, tiny
      // target changes otherwise flip the shortest-turn sign on consecutive frames.
      if (!turtle.avoidanceSide && Math.abs(turn) > 1.1) {
        turtle.avoidanceSide =
          Math.abs(turtle.turnSpeed) > 0.12
            ? Math.sign(turtle.turnSpeed)
            : Math.sign(turn) || (index === 0 ? 1 : -1);
      }
      if (turtle.avoidanceSide) {
        if (Math.abs(turn) < 0.45) turtle.avoidanceSide = undefined;
        else if (Math.sign(turn) !== turtle.avoidanceSide) {
          turn += turtle.avoidanceSide * Math.PI * 2;
        }
      }
      if (Math.abs(turn) < 0.035) turn = 0;
      // Curve and acceleration share the same onset and decay, forming one dart.
      const dashCurve =
        dashing && reaction
          ? reaction.dashDirection * 0.25 * Math.exp(-age * 3)
          : 0;
      let requestedTurn = clamp(
        turn * (dashing ? 2 : 1.2) + dashCurve,
        dashing ? -1.5 : -0.9,
        dashing ? 1.5 : 0.9,
      );
      const requestedSide =
        Math.abs(requestedTurn) > 0.08 ? Math.sign(requestedTurn) : 0;
      if (requestedSide && requestedSide !== turtle.steeringSide) {
        if (elapsed < (turtle.steeringHoldUntil ?? 0)) {
          // Coast out of the current turn instead of immediately counter-steering.
          requestedTurn = 0;
        } else {
          turtle.steeringSide = requestedSide;
          turtle.steeringHoldUntil = elapsed + 1.2;
        }
      }
      turtle.turnSpeed +=
        (requestedTurn - turtle.turnSpeed) *
        (1 - Math.exp(-dt * (dashing ? 8 : 2)));
      turtle.heading += turtle.turnSpeed * dt;
      const stroke = swimStroke(turtle.phase);
      // Inertia carries the turtle between strokes; propulsion follows the paddles.
      const targetSpeed =
        turtle.speed *
        turtle.pace *
        speedFactor *
        (0.65 + stroke.thrust * 1.2) *
        (1 - caution * 0.55) *
        (1 - clamp((Math.abs(turn) - 0.8) / 1.8, 0, 1) * 0.5);
      // The power stroke gives a quick surge; drag eases it into a longer coast.
      const response =
        targetSpeed > turtle.velocity
          ? dashing
            ? 8
            : 2.4
          : dashing
            ? 1.6
            : 0.6;
      turtle.velocity +=
        (targetSpeed - turtle.velocity) * (1 - Math.exp(-dt * response));
      const sway = Math.sin(turtle.phase - 0.4) * 0.012;
      turtle.x += Math.cos(turtle.heading + sway) * turtle.velocity * dt;
      turtle.y += Math.sin(turtle.heading + sway) * turtle.velocity * dt;
      const baseRate = turtle.appearance.strokeRate * Math.sqrt(turtle.pace);
      const recovering =
        dashing && reaction && turtle.phase < reaction.nextStroke;
      const desiredRate =
        recovering && reaction
          ? clamp(
              (reaction.nextStroke - turtle.phase) / 0.45,
              baseRate * 1.4,
              baseRate * 2.6,
            )
          : baseRate * clamp(Math.sqrt(speedFactor), 0.5, dashing ? 1.9 : 1.6);
      // Keep phase continuous and ease the cadence, including interrupted strokes.
      turtle.strokeVelocity ??= baseRate;
      turtle.strokeVelocity +=
        (desiredRate - turtle.strokeVelocity) * (1 - Math.exp(-dt * 5));
      turtle.phase += dt * turtle.strokeVelocity;
    });
    keepSpace();
    draw();
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    if (motion.matches || document.hidden) {
      draw();
      return;
    }
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * width;
    pointer.y = ((event.clientY - bounds.top) / bounds.height) * height;
    if (motion.matches) draw();
  };
  const leave = () => {
    pointer.x = -1000;
    pointer.y = -1000;
    if (motion.matches) draw();
  };
  const trigger = (index: number, x: number, y: number) => {
    if (motion.matches) return;
    const turtle = turtles[index];
    turtle.avoidanceSide = undefined;
    turtle.steeringHoldUntil = elapsed;
    const clickSide =
      Math.cos(turtle.heading) * (y - turtle.y) -
      Math.sin(turtle.heading) * (x - turtle.x);
    reaction = {
      dashDirection: clickSide >= 0 ? -1 : 1,
      index,
      start: elapsed,
      nextStroke:
        turtles[index].phase % (Math.PI * 2) < 0.35
          ? turtles[index].phase
          : (Math.floor(turtles[index].phase / (Math.PI * 2)) + 1) *
            Math.PI *
            2,
      x,
      y,
    };
  };
  const click = (event: MouseEvent) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, select, textarea, [role=dialog]")
    )
      return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    for (const [index, turtle] of turtles.entries()) {
      const size = turtle.size * (width < 700 ? 0.64 : 1);
      const tx = Math.floor(
        TEXTURE_SIZE / 2 + ((x - turtle.x) / size) * MODEL_SCALE,
      );
      const ty = Math.floor(
        TEXTURE_SIZE / 2 + ((y - turtle.y) / size) * MODEL_SCALE,
      );
      if (tx < 0 || ty < 0 || tx >= TEXTURE_SIZE || ty >= TEXTURE_SIZE)
        continue;
      const pixels = texture(
        turtle.phase,
        turtle.heading,
        turtle.appearance,
        turtle.turnSpeed,
      );
      // Allow the gaps between ASCII glyphs and a small touch-friendly margin.
      const tolerance = Math.ceil((10 / size) * MODEL_SCALE);
      let hit = false;
      for (
        let sy = Math.max(0, ty - tolerance);
        sy <= Math.min(TEXTURE_SIZE - 1, ty + tolerance) && !hit;
        sy += 2
      ) {
        for (
          let sx = Math.max(0, tx - tolerance);
          sx <= Math.min(TEXTURE_SIZE - 1, tx + tolerance);
          sx += 2
        ) {
          if (
            (sx - tx) ** 2 + (sy - ty) ** 2 <= tolerance ** 2 &&
            pixels[(sy * TEXTURE_SIZE + sx) * 4 + 3] > 30
          ) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        turtleClicks.add(event);
        pointer.x = x;
        pointer.y = y;
        trigger(index, x, y);
        break;
      }
    }
  };
  window.addEventListener("click", click);
  const paletteChanged = () => {
    if (motion.matches) draw();
  };
  canvas.addEventListener("palettechange", paletteChanged);
  resize();
  schedule();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("blur", leave);
  document.documentElement.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", schedule);
  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener("palettechange", paletteChanged);
    window.removeEventListener("click", click);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("blur", leave);
    document.documentElement.removeEventListener("pointerleave", leave);
    document.removeEventListener("visibilitychange", schedule);
    motion.removeEventListener("change", schedule);
  };
}
