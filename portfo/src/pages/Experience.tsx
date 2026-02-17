import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Job = {
  id: number;
  role: string;
  company: string;
  companyUrl: string;
  companyColor: string; // New field for the highlight color
  location: string;
  date: string;
  description: string;
  bullets: string[];
  img: string;
  tech: string[];
};

const jobs: Job[] = [
  {
    id: 2,
    role: "Robotics Researcher",
    company: "@WAT.ai", // Added @ to match the style
    companyUrl: "https://www.wat.ai",
    companyColor: "bg-yellow-100 hover:bg-yellow-200 border-black", // The yellow from your image
    location: "Waterloo, ON",
    date: "Jan 2026 - Present",
    description: "Teaching robots with human preferences, not just rewards.",
    bullets: [
      "Researching preference learning and human-feedback-driven optimization for sequential decision-making models.",
      "Implementing and evaluating learning pipelines in Python/PyTorch, collaborating with researchers on experimental design and analysis.",
      "Exploring scalable human-in-the-loop training setups to improve policy robustness under sparse or under specified reward signals.",
    ],
    img: "imgs/wat.png",
    tech: ["Pytorch", "Mujoco", "Python"],
  },
  {
    id: 1,
    role: "Software Engineer Intern",
    company: "@IPMD", // Added @ to match the style
    companyUrl: "https://ipmdinc.com",
    companyColor: "bg-blue-100 hover:bg-blue-200 border-black", // The pinkish/red from your image
    location: "San Mateo, CA",
    date: "July 2025 - Sept 2025",
    description: "Worked on an AI-powered personal therapist",
    bullets: [
      "Replaced custom auth logic with Flask-JWT-Extended, centralizing token management across 10 endpoints and resolving registration edge cases.",
      "Modularized frontend by extracting 5+ reusable components, reducing code duplication by 30% and accelerating future feature development.",
      "Built a real-time computer vision–driven emotion analysis pipeline integrated into a React (TypeScript) chat interface, surfacing live sentiment feedback during conversations.",
    ],
    img: "imgs/ipmd.jpeg",
    tech: ["Flask", "React", "TypeScript"],
  },
];

const Experience: React.FC = () => {
  const [visibleBullets, setVisibleBullets] = useState<number[]>([]);

  const toggleBullets = (id: number) => {
    setVisibleBullets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <section className="min-h-screen py-35 px-6 bg-white flex justify-center font-sans">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-end mb-16">
          <h1 className="text-4xl tracking-tight">
            Where I've been.
          </h1>
          <a
            href="/mle_resume.pdf"
            target="_blank"
            className="text-base border-b-1 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-all"
          >
            RESUME
          </a>
        </div>

        {/* Experience List */}
        <div className="space-y-12">
          {jobs.map((job) => (
            <div key={job.id} className="group relative flex gap-6">
              {/* Logo */}
              <div className="flex-shrink-0 pt-1">
                <img
                  src={job.img}
                  alt={job.company}
                  className="w-12 h-12 rounded-lg border border-black/10 object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div
                  className="flex justify-between items-start cursor-pointer select-none"
                  onClick={() => toggleBullets(job.id)}
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-black leading-snug flex flex-wrap items-baseline gap-x-2">
                      <span>{job.role}</span>
                      
                      {/* The Highlighted Company Link */}
                      <a
                        href={job.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-1 ${job.companyColor}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.company}
                      </a>
                    </h2>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                      <span>{job.date}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{job.location}</span>
                    </div>
                  </div>

                  {/* Original Icon Toggle */}
                  <div className="mt-1.5 flex-shrink-0 ml-4">
                    {visibleBullets.includes(job.id) ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="w-4 h-4 text-black hover:scale-110 transition-all duration-200"
                      >
                        <path
                          fill="currentColor"
                          d="M503.5 71C512.9 61.6 528.1 61.6 537.4 71L569.4 103C578.8 112.4 578.8 127.6 569.4 136.9L482.4 223.9L521.4 262.9C528.3 269.8 530.3 280.1 526.6 289.1C522.9 298.1 514.2 304 504.5 304L360.5 304C347.2 304 336.5 293.3 336.5 280L336.5 136C336.5 126.3 342.3 117.5 351.3 113.8C360.3 110.1 370.6 112.1 377.5 119L416.5 158L503.5 71zM136.5 336L280.5 336C293.8 336 304.5 346.7 304.5 360L304.5 504C304.5 513.7 298.7 522.5 289.7 526.2C280.7 529.9 270.4 527.9 263.5 521L224.5 482L137.5 569C128.1 578.4 112.9 578.4 103.6 569L71.6 537C62.2 527.6 62.2 512.4 71.6 503.1L158.6 416.1L119.6 377.1C112.7 370.2 110.7 359.9 114.4 350.9C118.1 341.9 126.8 336 136.5 336z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="w-4 h-4 text-black hover:scale-110 transition-all duration-200"
                      >
                        <path
                          fill="currentColor"
                          d="M408 64L552 64C565.3 64 576 74.7 576 88L576 232C576 241.7 570.2 250.5 561.2 254.2C552.2 257.9 541.9 255.9 535 249L496 210L409 297C399.6 306.4 384.4 306.4 375.1 297L343.1 265C333.7 255.6 333.7 240.4 343.1 231.1L430.1 144.1L391.1 105.1C384.2 98.2 382.2 87.9 385.9 78.9C389.6 69.9 398.3 64 408 64zM232 576L88 576C74.7 576 64 565.3 64 552L64 408C64 398.3 69.8 389.5 78.8 385.8C87.8 382.1 98.1 384.2 105 391L144 430L231 343C240.4 333.6 255.6 333.6 264.9 343L296.9 375C306.3 384.4 306.3 399.6 296.9 408.9L209.9 495.9L248.9 534.9C255.8 541.8 257.8 552.1 254.1 561.1C250.4 570.1 241.7 576 232 576z"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Tech Stack - Updated to Match the "Interests" style in image */}
                <div className="flex flex-wrap gap-2 mb-4 mt-3">
                  {job.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black bg-white border border-black"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Description / Bullets */}
                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    {visibleBullets.includes(job.id) ? (
                      <motion.ul
                        key="bullets"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 text-sm text-gray-700 list-disc ml-4 leading-relaxed"
                      >
                        {job.bullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </motion.ul>
                    ) : (
                      <motion.p
                        key="desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-gray-600 leading-relaxed"
                      >
                        {job.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;