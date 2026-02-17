const AboutMe = () => {
  const socialLinks = [
    {
      href: "https://x.com/IshanShahh",
      iconSrc: "/imgs/x.svg",
      label: "Twitter",
    },
    {
      href: "https://github.com/Ishan8840",
      iconSrc: "/imgs/github.svg",
      label: "GitHub",
    },
    {
      href: "https://www.linkedin.com/in/ishahh",
      iconSrc: "/imgs/linkedin.svg",
      label: "LinkedIn",
    },
    {
      href: "mailto:i9shah@uwaterloo.ca",
      iconSrc: "/imgs/email.svg",
      label: "Email",
    },
  ];

  const interests = [
    { label: "Robot Learning", styles: "bg-white hover:bg-blue-100 border-black" },
    { label: "Embodied AI", styles: "bg-white hover:bg-purple-100 border-black" },
    { label: "Soccer", styles: "bg-white hover:bg-green-100 border-black" },
    { label: "Snowboarding", styles: "bg-white hover:bg-orange-100 border-black" },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-stone">
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end p-6 pb-20 md:justify-center md:p-12 lg:p-24 lg:left-30 lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent md:hidden" />
        <div className="relative space-y-4 md:space-y-6">
          <div className="space-y-1">
            <h1 className="group text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-black leading-none pointer-events-auto cursor-default">
              I'm Ishan{" "}
              <span className="inline-block transition-transform duration-300 ease-in-out group-hover:rotate-[20deg]">
                👋
              </span>
            </h1>
          </div>

          <div className="flex items-center pointer-events-auto gap-3 md:gap-4">
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
                    className="w-5 h-5 sm:w-6 sm:h-6 hover:scale-115 transition-all duration-50 ease-in-out cursor-pointer"
                  />
                </a>
              ))}
            </div>

          {/* Bio - Adjusts width and font size for small screens */}
          <p className="max-w-md text-base sm:text-lg leading-relaxed text-slate-800 font-medium md:max-w-xl">
            I study{" "}
            <a
            href="https://uwaterloo.ca/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-yellow-100 px-1 font-bold text-black transition-colors duration-200 hover:bg-yellow-300 pointer-events-auto cursor-pointer">
              @waterloo
            </a>
            . I spend my time reading, writing, playing sports, and meeting new
            people. I am incoming{" "}
            <a
            href="https://www.axibo.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-red-200 px-1 text-black transition-colors duration-200 hover:bg-red-400 pointer-events-auto cursor-pointer">
              @AXIBO
            </a>
            , where I will be working on{" "}
            <span className="bg-blue-100 px-1 text-black transition-colors duration-200 hover:bg-blue-400 pointer-events-auto cursor-pointer">
              RL & VLAs
            </span>{" "}
            for humanoids.
          </p>

          <div className="">
            <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-3">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {interests.map(
                (item) => (
                  <span
                    key={item.label}
                    className={`border px-2 py-1 text-[10px] sm:text-xs md:text-sm font-mono font-semibold uppercase tracking-tight transition-all duration-200 pointer-events-auto cursor-default ${item.styles}`}
                  >
                    {item.label}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <iframe
          src="https://my.spline.design/nexbotrobotcharacterconcept-5lKYOvMhG9geumgjyPctRpB9/"
          className="h-[calc(100%+110px)] w-full border-none md:scale-90 md:origin-right lg:scale-100"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default AboutMe;
