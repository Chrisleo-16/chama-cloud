import { motion } from "framer-motion";

const brands = ["Savings Zone", "Women in Business", "Youth Chama", "Farmers Co-op", "Nairobi Sacco"];

const TrustBar = () => (
  <section className="border-y border-border bg-secondary/50">
    <div className="cc-section py-8 md:py-10">
      <motion.p
        className="text-center text-sm text-muted-foreground mb-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Trusted by <span className="font-semibold text-foreground font-mono-num">500+</span> chamas across Kenya
      </motion.p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
        {brands.map((brand, i) => (
          <motion.span
            key={brand}
            className="text-muted-foreground/60 font-display text-lg font-semibold whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            {brand}
          </motion.span>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;
