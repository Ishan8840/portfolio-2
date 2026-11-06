export type Project = {
  id: number;
  title: string;
  description: string;
  video: string;
  caption: string;
  tech: string[];
  github?: string;
  demo?: string;
  twitter?: string;
  website?: string;
  websiteLabel?: string;
};

export const projects: Project[] = [
  {
    id: 4,
    title: "deep dive into deep learning",
    description:
      "diving into the foundations of robot learning and reimplementing the core breakthroughs from scratch",
    video: "/videos/deep-learning.mp4",
    caption: "From pixels to action. Still learning.",
    tech: [],
    website: "https://ishan8840.github.io/deep-learning-notes/",
    websiteLabel: "Notes",
    github: "https://github.com/Ishan8840/deep-learning",
    twitter: "https://x.com/IshanShahh/status/2118769130983551218",
  },
  {
    id: 3,
    title: "origami challenge - IROS 2026",
    description:
      "long-horizon policy for 65-DoF, fusing vision + tactile sensing with learned hierarchical planning to fold a six-fold paper airplane.",
    video: "/videos/sharpa.mp4",
    caption: "65 degrees of freedom. Vision + touch.",
    tech: ["JAX", "PyTorch", "Tactile", "VLA"],
    website: "https://robotic-origami-challenge.github.io",
  },
  {
    id: 2,
    title: "espresso robot",
    description:
      "implemented hierarchical planning for Vision-Language-Action models",
    video: "/videos/coffee.mp4",
    caption: "A 2-minute coffee routine.",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "/writing/working-with-vlas-training-inference",
    websiteLabel: "Notes",
  },
  {
    id: 1,
    title: "laundry folding robot",
    description:
      "improved the data, algorithms, and infrastructure behind π₀.₅ for deformable task learning",
    video: "/videos/fold.mp4",
    caption: "Learning to fold with π₀.₅.",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "/writing/working-with-vlas-training-inference",
    websiteLabel: "Notes",
  },
];
