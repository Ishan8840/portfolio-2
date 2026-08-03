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
    title: "Study Buddy",
    description:
      "Gamified AI study habit tracker using MediaPipe for real-time detection to monitor focus, distractions, and face-touching",
    video: "/videos/studybuddy.mp4",
    poster: "/imgs/study-poster.webp",
    tech: ["FastAPI", "React", "Redis", "MediaPipe"],
    github: "https://github.com/Ishan8840/StudyBuddy",
    website: "https://studybuddy-htv.vercel.app/",
    color: "bg-purple-300",
  },
  {
    id: 2,
    title: "OperAid",
    description:
      "Voice-controlled platform that eliminates the need for manual record searching.",
    video: "/videos/operaid.mp4",
    poster: "/imgs/operaid-poster.webp",
    tech: ["Next.js", "OpenAI", "ElevenLabs"],
    github: "https://github.com/Ishan8840/OperAId",
    website: "https://operaid.framer.website/",
    color: "bg-blue-300",
  },
  {
    id: 3,
    title: "HackMate",
    description:
      "A Tinder-style project discovery app for hackers and makers. Swipe right to show interest, left to pass.",
    video: "/videos/hackmate.mp4",
    poster: "/imgs/hackmate-poster.webp",
    tech: ["React", "Typscript", "Supabase"],
    github: "https://github.com/Ishan8840/HackMate",
    color: "bg-red-300",
  },
];
