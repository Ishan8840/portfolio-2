export type Project = {
  id: number;
  title: string;
  description: string;
  video: string;
  tech: string[];
  github?: string;
  demo?: string;
  twitter?: string;
  website?: string;
  color: string;
};

export const projects: Project[] = [
  {
    id: 3,
    title: "origami challenge - IROS 2026",
    description:
      "long-horizon policy for 65-DoF, fusing vision + tactile sensing with learned hierarchical planning to fold a six-fold paper airplane.",
    video: "/videos/sharpa.mp4",
    tech: ["JAX", "PyTorch", "Tactile", "VLA"],
    website: "https://robotic-origami-challenge.github.io",
    color: "bg-red-300",
  },
  {
    id: 2,
    title: "espresso robot",
    description: "implemented hierarchical planning for Vision-Language-Action models",
    video: "/videos/coffee.mp4",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "http://ishanshah.org/writing/working-with-vlas-training-inference",
    color: "bg-purple-300",
  },
  {
    id: 1,
    title: "laundry folding robot",
    description: "improved the data, algorithms, and infrastructure behind π₀.₅ for deformable task learning",
    video: "/videos/fold.mp4",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "http://ishanshah.org/writing/working-with-vlas-training-inference",
    color: "bg-blue-300",
  },
];
