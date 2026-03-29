import { motion } from "framer-motion";
import { Coins, FileText, CreditCard } from "lucide-react";

const features = [
  {
    icon: Coins,
    title: "Member Contributions",
    desc: "Auto-calculate shares, track payments in real-time, and send smart reminders to keep everyone on track.",
  },
  {
    icon: CreditCard,
    title: "Loan Management",
    desc: "Apply, approve, and repay loans with interest tracking. Full history and transparency for every member.",
  },
  {
    icon: FileText,
    title: "Instant Statements",
    desc: "Generate PDF reports, view balance overviews, and access complete transaction logs anytime.",
  },
];

const Features = () => (
  <section id="features" className="cc-section">
    <motion.div
      className="text-center mb-14"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <span className="cc-badge bg-primary/10 text-primary mb-3">Features</span>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Everything your chama needs
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        From contributions to loans to statements — manage it all from one beautiful dashboard.
      </p>
    </motion.div>

    <div className="grid md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          className="cc-card group"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
            <f.icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{f.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{f.desc}</p>
          <button className="text-primary text-sm font-semibold hover:underline">Learn more →</button>
        </motion.div>
      ))}
    </div>
  </section>
);

export default Features;
