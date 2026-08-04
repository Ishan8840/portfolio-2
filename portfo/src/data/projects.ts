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
    title: "PiPER-X VLA",
    description: "researching scalable robot learning systems by improving the data, algorithms, and infrastructure behind Vision-Language-Action models for real-world manipulation.",
    video: "/videos/fold.mp4",
    poster: "/imgs/fold.png",
    tech: ["pi05", "VLA", "JAX", "PyTorch"],
    website: "https://operaid.framer.website/",
    color: "bg-blue-300",
  },
];
