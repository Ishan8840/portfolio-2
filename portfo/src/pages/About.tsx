import { motion } from "framer-motion";

const AboutMe = () => {
  const socialLinks = [
    { href: "https://x.com/IshanShahh", iconSrc: "/imgs/x.svg", label: "Twitter" },
    { href: "https://github.com/Ishan8840", iconSrc: "/imgs/github.svg", label: "GitHub" },
    { href: "https://www.linkedin.com/in/ishahh", iconSrc: "/imgs/linkedin.svg", label: "LinkedIn" },
    { href: "https://mailto:i9shah@uwaterloo.ca", iconSrc: "/imgs/email.svg", label: "Email" },
  ];

  const interests = [
    { label: "Robot Learning", styles: "bg-white hover:bg-blue-100 border-black" },
    { label: "Embodied AI", styles: "bg-white hover:bg-purple-100 border-black" },
    { label: "Soccer", styles: "bg-white hover:bg-green-100 border-black" },
    { label: "Snowboarding", styles: "bg-white hover:bg-orange-100 border-black" },
  ];

  // Animation variants for staggered children
  const containerVars = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1, // This makes the elements appear one after another
      },
    },
  };

  const itemVars = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-stone">
      {/* Main Content Area */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end p-6 pb-20 md:justify-center md:p-12 lg:p-24 lg:left-30 lg:w-1/2"
        variants={containerVars}
        initial="initial"
        animate="animate"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent md:hidden" />
        
        <div className="relative space-y-4 md:space-y-6">
          {/* Headline */}
          <motion.div variants={itemVars}>
            <h1 className="group text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-black leading-none pointer-events-auto cursor-default font-black">
              I'm Ishan{" "}
              <span className="inline-block transition-transform duration-300 ease-in-out group-hover:rotate-[20deg]">
                👋
              </span>
            </h1>
          </motion.div>

          {/* Socials */}
          <motion.div variants={itemVars} className="flex items-center pointer-events-auto gap-3 md:gap-4">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                aria-label={link.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={link.iconSrc}
                  alt={link.label}
                  className="w-5 h-5 sm:w-6 sm:h-6 hover:scale-125 transition-all duration-300 ease-in-out cursor-pointer"
                />
              </a>
            ))}
          </motion.div>

          {/* Bio */}
          <motion.p variants={itemVars} className="max-w-md text-base sm:text-lg leading-relaxed text-slate-800 font-medium md:max-w-xl">
            I study{" "}
            <a
              href="https://uwaterloo.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-100 px-1 text-black transition-colors duration-200 hover:bg-yellow-300 pointer-events-auto cursor-pointer"
            >
              @uwaterloo
            </a>
            . I spend my time building, writing, playing sports, and meeting new people. I am an incoming{" "}
            <a
              href="https://www.axibo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-200 px-1 text-black transition-colors duration-200 hover:bg-red-400 pointer-events-auto cursor-pointer"
            >
              @AXIBO
            </a>
            , where I will be working on{" "}
            <span className="bg-blue-100 px-1 text-black transition-colors duration-200 hover:bg-blue-400 pointer-events-auto cursor-default">
              RL & VLAs
            </span>{" "}
            for humanoids.
          </motion.p>

          {/* Interests */}
          <motion.div variants={itemVars}>
            <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-3">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {interests.map((item) => (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  key={item.label}
                  className={`border px-2 py-1 text-[10px] sm:text-xs md:text-sm font-mono font-semibold uppercase tracking-tight transition-all duration-200 pointer-events-auto cursor-default ${item.styles}`}
                >
                  {item.label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Spline Robot - Fades in slightly after text */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <iframe
          src="https://my.spline.design/nexbotrobotcharacterconcept-JPKZZ66iDXCjIQbfPLWqGt4Y/"
          className="h-[calc(100%+110px)] w-full border-none md:scale-90 md:origin-right lg:scale-100"
          allowFullScreen
        ></iframe>
      </motion.div>
    </div>
  );
};

export default AboutMe;