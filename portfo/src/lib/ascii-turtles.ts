import type { MusicPalette, RGB } from "./music-palette";

/** Procedural turtle silhouettes sampled onto an upright ASCII grid.
 * Inspired by the rendering approach in github.com/stackedlol/ascii-sharks;
 * turtle geometry, shading and movement are implemented here independently.
 */
export const turtleEffects = [
  {
    id: "shimmer-dash",
    label: "Shimmer + dash",
    hint: "A shell highlight sweeps through a quick dash, then a gentle coast.",
  },
  {
    id: "curious",
    label: "Curious turn",
    hint: "Turns toward you, pauses, then carries on.",
  },
  {
    id: "dash",
    label: "Startled dash",
    hint: "A quick paddle and a short burst of speed.",
  },
  {
    id: "scatter",
    label: "ASCII scatter",
    hint: "Characters drift apart and gather back together.",
  },
  {
    id: "follow",
    label: "Follow me",
    hint: "Move your cursor; the turtle follows briefly.",
  },
  {
    id: "shimmer",
    label: "Shell shimmer",
    hint: "One soft highlight sweeps across the shell.",
  },
  {
    id: "companion",
    label: "Companion moment",
    hint: "The other turtle approaches and swims alongside.",
  },
] as const;
export type TurtleEffect = (typeof turtleEffects)[number]["id"];
const effectDuration: Record<TurtleEffect, number> = {
  curious: 4,
  dash: 4,
  "shimmer-dash": 4,
  scatter: 2.8,
  follow: 7,
  shimmer: 2.2,
  companion: 14,
};

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
    const tail = new Path2D(
      "M -.54 -.045 Q -.72 -.05 -.80 0 Q -.72 .05 -.54 .045 Z",
    );
    g.fill(tail);
    g.stroke(tail);
    // Short neck and rounded, blunt head, with eyes on both sides.
    const head = new Path2D(
      "M .42 -.10 Q .57 -.08 .63 -.13 C .73 -.22 .93 -.15 .94 -.03 Q .96 .10 .81 .16 Q .69 .18 .60 .10 L .42 .10 Z",
    );
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
  getEffect: () => TurtleEffect = () => "shimmer-dash",
  onTrigger: (effect: TurtleEffect, reduced: boolean) => void = () => {},
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
    kind: TurtleEffect;
    start: number;
    nextStroke: number;
    dashDirection: number;
    x: number;
    y: number;
  } | null = null;
  const pigments: { shell: RGB; skin: RGB }[] = [];
  let paletteTime = performance.now();
  let musicStrength = 0;
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
    const glyphOffsets = new Map(
      [...".:;itx%#@"].map((glyph) => {
        const metrics = ctx.measureText(glyph);
        return [
          glyph,
          (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
            2,
        ];
      }),
    );
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
      const progress = active
        ? clamp((elapsed - active.start) / effectDuration[active.kind], 0, 1)
        : 0;
      const shimmerProgress = active
        ? clamp(
            (elapsed - active.start) /
              (active.kind === "shimmer-dash" ? 1.2 : 2.2),
            0,
            1,
          )
        : 0;
      const scatter =
        active?.kind === "scatter" ? Math.sin(Math.PI * progress) ** 2 : 0;
      const size = turtle.size * (width < 700 ? 0.64 : 1);
      const radius = size * 1.3;
      const pixels = texture(
        turtle.phase,
        turtle.heading,
        { ...turtle.appearance, ...colors },
        turtle.turnSpeed,
      );
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
          const localX =
            ((px - turtle.x) * Math.cos(turtle.heading) +
              (py - turtle.y) * Math.sin(turtle.heading)) /
            size;
          const localY =
            (-(px - turtle.x) * Math.sin(turtle.heading) +
              (py - turtle.y) * Math.cos(turtle.heading)) /
            size;
          const onShell =
            ((localX + 0.06) / 0.6) ** 2 + (localY / 0.44) ** 2 < 1;
          const glint =
            (active?.kind === "shimmer" || active?.kind === "shimmer-dash") &&
            onShell
              ? Math.exp(
                  -(((localX - (0.8 - shimmerProgress * 1.6)) / 0.14) ** 2),
                ) * Math.sin(shimmerProgress * Math.PI)
              : 0;
          const alpha =
            Math.min(
              0.98,
              0.56 -
                fade * 0.23 +
                illumination * 0.18 +
                musicStrength * 0.33 +
                glint * 0.5,
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
          const cellX = Math.round((px - turtle.x) / cw),
            cellY = Math.round((py - turtle.y) / ch);
          const seed = Math.sin(cellX * 127.1 + cellY * 311.7) * 43758.5453;
          const angle = (seed - Math.floor(seed)) * Math.PI * 2;
          const x =
            px +
            ((px - pointer.x) / directionLength) * push +
            Math.cos(angle) * scatter * 38;
          const y =
            py +
            ((py - pointer.y) / directionLength) * push +
            Math.sin(angle) * scatter * 38;
          const opacity = alpha * (0.6 + shade * 0.4);
          ctx.fillStyle = `rgba(${pixels[i]}, ${pixels[i + 1]}, ${pixels[i + 2]}, ${opacity})`;
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
    if (reaction && elapsed - reaction.start >= effectDuration[reaction.kind])
      reaction = null;
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
      const dashing =
        reaction?.index === index &&
        (reaction.kind === "dash" || reaction.kind === "shimmer-dash");
      const aim = (x: number, y: number) => {
        const dx = x - turtle.x,
          dy = y - turtle.y;
        const length = Math.hypot(dx, dy) || 1;
        desiredX = dx / length;
        desiredY = dy / length;
        return length;
      };
      if (reaction?.index === index) {
        if (reaction.kind === "curious" && age < 2.7) {
          aim(reaction.x, reaction.y);
          speedFactor = age < 1.5 ? 0.3 : 0.08;
        } else if (
          reaction.kind === "dash" ||
          reaction.kind === "shimmer-dash"
        ) {
          desiredX = Math.cos(turtle.heading);
          desiredY = Math.sin(turtle.heading);
          speedFactor = 1 + 3.2 * Math.exp(-age * 1.1);
        } else if (reaction.kind === "follow") {
          const r = radiusOf(turtle) + 12;
          const distance = aim(
            clamp(pointer.x > 0 ? pointer.x : reaction.x, r, width - r),
            clamp(pointer.y > 0 ? pointer.y : reaction.y, r, height - r),
          );
          speedFactor = clamp(distance / 100, 0.08, 1.35);
        } else if (reaction.kind === "scatter") speedFactor = 0.15;
      }
      if (reaction?.kind === "companion") {
        if (reaction.index === index) speedFactor = 0.6;
        else {
          const leader = neighbors[reaction.index];
          const spacing = radiusOf(turtle) + radiusOf(leader) + 45;
          const side = leader.x > width / 2 ? 1 : -1;
          const distance = aim(
            leader.x - Math.sin(leader.heading) * spacing * side,
            leader.y + Math.cos(leader.heading) * spacing * side,
          );
          speedFactor = distance > 80 ? 1.35 : 0.65;
        }
      }
      const radius = radiusOf(turtle) + 12;
      // Bound prediction so a dash cannot swing the avoidance target across the viewport.
      const lookAhead = clamp(turtle.velocity * 2.5, 60, 120);
      const lookX = turtle.x + Math.cos(turtle.heading) * lookAhead;
      const lookY = turtle.y + Math.sin(turtle.heading) * lookAhead;
      const edgeRange = 80;
      desiredX +=
        Math.max(0, (radius + edgeRange - lookX) / edgeRange) * 3 -
        Math.max(0, (lookX - width + radius + edgeRange) / edgeRange) * 3;
      desiredY +=
        Math.max(0, (radius + edgeRange - lookY) / edgeRange) * 3 -
        Math.max(0, (lookY - height + radius + edgeRange) / edgeRange) * 3;
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
          ? reaction.dashDirection * 0.65 * Math.exp(-age * 1.1)
          : 0;
      let requestedTurn = clamp(turn * 1.2 + dashCurve, -0.9, 0.9);
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
    const kind = getEffect();
    onTrigger(kind, motion.matches);
    if (motion.matches) return;
    const turtle = turtles[index];
    const clickSide =
      Math.cos(turtle.heading) * (y - turtle.y) -
      Math.sin(turtle.heading) * (x - turtle.x);
    reaction = {
      dashDirection: clickSide >= 0 ? -1 : 1,
      index,
      kind,
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
