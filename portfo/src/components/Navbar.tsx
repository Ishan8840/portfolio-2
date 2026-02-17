import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { pathname } = useLocation();
  
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Experience', path: '/experience' },
    { name: 'Projects', path: '/projects' },
    { name: 'Writing', path: '/writing' }
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-[9999] py-12 px-6 pointer-events-none font-sans">
      <div className="max-w-fit mx-auto pointer-events-auto">
        <div className="flex items-center gap-8 sm:gap-12">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`text-[10px] uppercase tracking-[0.3em] transition-all duration-500 text-black whitespace-nowrap
                  ${active 
                    ? 'opacity-100 font-black' 
                    : 'opacity-30 hover:opacity-100 hover:tracking-[0.45em]'
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;