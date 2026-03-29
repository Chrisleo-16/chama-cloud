import { motion } from "framer-motion";
import { Play } from "lucide-react";
import heroImg from "@/assets/hero-illustration.jpg";
import { Link } from "react-router-dom";

const Hero = () => (
  <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
    {/* Background decoration */}
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
    </div>

    <div className="cc-section flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-0">
      <motion.div
        className="flex-1 text-center lg:text-left"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <span className="cc-badge bg-primary/10 text-primary mb-4 inline-block">
          🌱 Built for African savings groups
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
          Grow your chama together,{" "}
          <span className="text-primary">without the paperwork.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
          Digital records, instant statements, and full member transparency — all in one platform designed for the way your chama works.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
          <button className="cc-btn-primary text-base px-8 py-3.5">
            <Link to="/register">Start a free trial</Link>
          </button>
          <button className="cc-btn-outline text-base px-8 py-3.5">
            <Play className="h-4 w-4" /> Watch demo
          </button>
        </div>
      </motion.div>

      <motion.div
        className="flex-1 max-w-lg lg:max-w-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-3xl -rotate-3 scale-105" />
          <img
            src={heroImg}
            alt="African community savings group illustration"
            className="relative rounded-3xl shadow-2xl w-full"
            width={1024}
            height={768}
          />
        </div>
      </motion.div>
    </div>
  </section>
);

export default Hero;
