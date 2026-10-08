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
};

export const projects: Project[] = [
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
  },
];
