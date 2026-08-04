export type Job = {
  id: number;
  role: string;
  company: string;
  companyUrl: string;
  companyColor: string;
  location: string;
  date: string;
  description: string;
  bullets: string[];
  img: string;
  tech: string[];
};

export const jobs: Job[] = [
  {
    id: 3,
    role: "research engineer",
    company: "@axibo",
    companyUrl: "https://www.axibo.com/",
    companyColor: "bg-red-300 hover:bg-red-400 border-black",
    location: "Cambridge, ON",
    date: "May 2026 - Present",
    description: "foundation models for humanoids",
    bullets: [
      "Developing and deploying foundation models to enhance autonomous bimanual manipulation and locomotion capabilities for humanoid robotic platforms.",
    ],
    img: "/imgs/axibo.jpeg",
    tech: ["Pytorch", "IsaacLab", "Python"],
  },
  {
    id: 2,
    role: "robotics researcher",
    company: "@wat.ai",
    companyUrl: "https://watai.ca/",
    companyColor: "bg-yellow-200 hover:bg-yellow-400 border-black",
    location: "Waterloo, ON",
    date: "Jan 2026 - July 2026",
    description: "teaching robots with human preferences, not just rewards.",
    bullets: [
      "Researching preference learning and human-feedback-driven optimization for sequential decision-making models.",
      "Implementing and evaluating learning pipelines in Python/PyTorch, collaborating with researchers on experimental design and analysis.",
      "Exploring scalable human-in-the-loop training setups to improve policy robustness under sparse or under specified reward signals.",
    ],
    img: "/imgs/wat.png",
    tech: ["Pytorch", "Mujoco", "Python"],
  },
  {
    id: 1,
    role: "software engineer",
    company: "@ipmd",
    companyUrl: "https://ipmdinc.com",
    companyColor: "bg-blue-200 hover:bg-blue-400 border-black",
    location: "San Mateo, CA",
    date: "July 2025 - Sept 2025",
    description: "worked on an ai-powered personal therapist",
    bullets: [
      "Replaced custom auth logic with Flask-JWT-Extended, centralizing token management across 10 endpoints and resolving registration edge cases.",
      "Modularized frontend by extracting 5+ reusable components, reducing code duplication by 30% and accelerating future feature development.",
      "Built a real-time computer vision–driven emotion analysis pipeline integrated into a React (TypeScript) chat interface, surfacing live sentiment feedback during conversations.",
    ],
    img: "/imgs/ipmd.jpeg",
    tech: ["Flask", "React", "TypeScript"],
  },
];
