import { motion } from "framer-motion";
import { Users, Wallet, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Users,
    num: "01",
    title: "Create your chama",
    desc: "Set your group name, contribution frequency, and invite members in minutes.",
  },
  {
    icon: Wallet,
    num: "02",
    title: "Members contribute",
    desc: "Collect payments via M-Pesa or bank transfer. Automatic tracking and receipts.",
  },
  {
    icon: TrendingUp,
    num: "03",
    title: "Grow & withdraw",
    desc: "Track savings, apply for loans, and withdraw at the end of your cycle.",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="bg-secondary/30">
    <div className="cc-section">
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="cc-badge bg-primary/10 text-primary mb-3">How it works</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Three simple steps
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Get your chama up and running in under 5 minutes.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-border" />

        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            className="text-center relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
          >
            <div className="relative z-10 mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
              <s.icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="font-mono-num text-xs text-muted-foreground tracking-widest">STEP {s.num}</span>
            <h3 className="text-xl font-bold text-foreground mt-2 mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
