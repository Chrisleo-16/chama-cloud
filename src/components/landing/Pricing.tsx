import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    desc: "Perfect for small groups getting started.",
    features: ["Up to 10 members", "Contribution tracking", "Basic reports", "Email support"],
    popular: false,
  },
  {
    name: "Pro",
    price: "KES 500",
    period: "/month",
    desc: "For growing chamas that need more power.",
    features: ["Up to 50 members", "Loan management", "PDF statements", "M-Pesa integration", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Unlimited scale with dedicated support.",
    features: ["Unlimited members", "API access", "Dedicated manager", "Custom branding", "SLA guarantee"],
    popular: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="cc-section">
    <motion.div
      className="text-center mb-14"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <span className="cc-badge bg-primary/10 text-primary mb-3">Pricing</span>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Simple, transparent pricing
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Start free. Upgrade when you're ready. No hidden fees.
      </p>
    </motion.div>

    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.name}
          className={`cc-card relative flex flex-col ${plan.popular ? "border-primary shadow-xl ring-1 ring-primary/20 scale-[1.02]" : ""}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 cc-badge bg-accent/20 text-accent-foreground border border-accent/30 text-xs">
              Most popular
            </span>
          )}
          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>
          <div className="mb-6">
            <span className="text-4xl font-bold font-mono-num text-foreground">{plan.price}</span>
            {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button className={plan.popular ? "cc-btn-primary w-full" : "cc-btn-outline w-full"}>
            {plan.price === "Custom" ? "Contact sales" : "Get started"}
          </button>
        </motion.div>
      ))}
    </div>
  </section>
);

export default Pricing;
