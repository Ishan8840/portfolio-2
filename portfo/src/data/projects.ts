export type Project = {
  id: number;
  title: string;
  description: string;
  video: string;
  poster?: string;
  tech: string[];
  github?: string;
  demo?: string;
  twitter?: string;
  website?: string;
  color: string;
};

export const projects: Project[] = [
  {
    id: 1,
    title: "laundry folding robot",
    description: "improved the data, algorithms, and infrastructure behind Vision-Language-Action models for deformable task learning",
    video: "/videos/fold.mp4",
    poster: "/imgs/fold.webp",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "http://ishanshah.org/writing/working-with-vlas-training-inference",
    color: "bg-blue-300",
  },
   {
    id: 1,
    title: "espresso robot",
    description: "implemented hierarchical planning for Vision-Language-Action models",
    video: "/videos/coffee.mp4",
    poster: "/imgs/coffee.webp",
    tech: ["RL", "VLA", "JAX", "PyTorch"],
    website: "http://ishanshah.org/writing/working-with-vlas-training-inference",
    color: "bg-green-300",
  },
];
