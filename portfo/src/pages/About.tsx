import { motion } from "framer-motion";
import { socials } from "../lib/nav";

const interests = [
  "World models",
  "Automated research",
  "Using internet video for physical intelligence",
];

const containerVars = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 },
  },
};

const itemVars = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const AboutMe = () => {
  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-32 font-sans">
      <motion.div
        className="w-full max-w-2xl"
        variants={containerVars}
        initial="initial"
        animate="animate"
      >
        <div className="space-y-5 md:space-y-6">
          <motion.div variants={itemVars}>
            <h1 className="group text-4xl font-black leading-none tracking-tighter text-ink sm:text-5xl md:text-6xl">
              I'm Ishan{" "}
              <span className="inline-block transition-transform duration-300 ease-in-out group-hover:rotate-[20deg]">
                👋
              </span>
            </h1>
          </motion.div>

          <motion.div variants={itemVars} className="flex items-center gap-3 md:gap-4">
            {socials.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                <img
                  src={link.icon}
                  alt={link.label}
                  className="h-5 w-5 transition-all duration-300 ease-in-out hover:scale-125 sm:h-6 sm:w-6"
                />
              </a>
            ))}
          </motion.div>

          <motion.p
            variants={itemVars}
            className="max-w-xl text-base font-medium leading-relaxed text-ink sm:text-lg"
          >
            I study{" "}
            <a
              href="https://uwaterloo.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-200 px-1 text-black transition-colors duration-200 hover:bg-yellow-400"
            >
              @uwaterloo
            </a>
            . I spend my time building, writing, playing sports, and meeting new people. I
            am currently{" "}
            <a
              href="https://www.axibo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-300 px-1 text-black transition-colors duration-200 hover:bg-red-400"
            >
              @AXIBO
            </a>
            , where I am working on{" "}
            <span className="bg-blue-200 px-1 text-black transition-colors duration-200 hover:bg-blue-400">
              RL & VLAs
            </span>{" "}
            for humanoids.
          </motion.p>

          {/* Indexed hairline list. These are phrases, not one-word tags, so
              they're set in the body face for readability; the mono numerals and
              hairlines carry the same meta system used elsewhere on the site.
              Width matches the bio above so the column edges line up. */}
          <motion.div variants={itemVars} className="max-w-xl pt-1">
            <h2 className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-subtle">
              Interests
            </h2>
            <ul>
              {interests.map((label, i) => (
                <li
                  key={label}
                  className="group flex items-baseline gap-4 border-b border-ink/10 py-2.5"
                >
                  <span
                    aria-hidden
                    className="font-mono text-[10px] tabular-nums text-subtle transition-colors duration-200 group-hover:text-muted"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-snug text-ink transition-colors duration-200 group-hover:text-ink sm:text-base">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutMe;
