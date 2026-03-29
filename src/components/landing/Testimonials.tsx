import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Chama Cloud saved us hours of manual calculation. Now we meet just to celebrate.",
    name: "Jane M.",
    group: "Mwiki Women Group",
    rating: 5,
  },
  {
    quote: "The loan tracking feature alone is worth it. No more confusion about who owes what.",
    name: "Peter K.",
    group: "Nairobi Youth Savers",
    rating: 5,
  },
  {
    quote: "We went from paper records to digital in one afternoon. The M-Pesa integration is seamless.",
    name: "Grace O.",
    group: "Farmers Co-op Eldoret",
    rating: 5,
  },
];

const Testimonials = () => (
  <section id="testimonials" className="bg-secondary/30">
    <div className="cc-section">
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="cc-badge bg-primary/10 text-primary mb-3">Testimonials</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Loved by chamas everywhere
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className="cc-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-foreground text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
            <div>
              <p className="font-semibold text-foreground text-sm">{t.name}</p>
              <p className="text-muted-foreground text-xs">{t.group}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
