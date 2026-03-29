import { Leaf } from "lucide-react";

const links = {
  Product: ["Features", "Pricing", "Blog", "Changelog"],
  Company: ["About", "Contact", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security"],
};

const Footer = () => (
  <footer className="border-t border-border bg-secondary/30">
    <div className="cc-section py-12 md:py-16">
      <div className="grid md:grid-cols-4 gap-10 mb-10">
        <div>
          <a href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-3">
            <Leaf className="h-5 w-5 text-primary" />
            Chama Cloud
          </a>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The modern platform for African savings groups. Manage contributions, loans, and payouts — digitally.
          </p>
        </div>
        {Object.entries(links).map(([title, items]) => (
          <div key={title}>
            <h4 className="font-semibold text-foreground text-sm mb-3">{title}</h4>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Chama Cloud. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {["Twitter", "LinkedIn", "WhatsApp"].map((s) => (
            <a key={s} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
