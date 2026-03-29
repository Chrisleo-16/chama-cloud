import { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const navLinks = ["Features", "How it Works", "Pricing", "Testimonials"];

const Header = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          Chama Cloud
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link.toLowerCase().replace(/\s+/g, "-"))}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Link to="/login">Log in</Link>
          </button>
          <button className="cc-btn-primary text-sm px-4 py-2">
            <Link to="/register">Get started</Link>
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => scrollTo(link.toLowerCase().replace(/\s+/g, "-"))}
                  className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link}
                </button>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                <button className="block w-full text-left text-sm font-medium text-muted-foreground">
                  <Link to="/login">
                  Log in
                  </Link>
                  </button>
                <button className="cc-btn-primary w-full text-sm">
                  <Link to="/register">
                    Get started
                  </Link>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
