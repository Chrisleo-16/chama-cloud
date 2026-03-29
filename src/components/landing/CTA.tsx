import { motion } from "framer-motion";

const CTA = () => (
  <section className="cc-section">
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 md:py-20 text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          Ready to bring your chama online?
        </h2>
        <p className="text-primary-foreground/80 max-w-md mx-auto mb-8 text-lg">
          No credit card required. Free for 30 days.
        </p>
        <button className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-primary-foreground text-primary px-8 py-3.5 font-semibold text-base transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          Start your free trial
        </button>
        <p className="text-primary-foreground/60 text-sm mt-4">No commitment, cancel anytime.</p>
      </div>
    </motion.div>
  </section>
);

export default CTA;
