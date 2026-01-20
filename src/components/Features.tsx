import { Zap, Shield, Clock, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second settlements powered by Solana's 400ms block times",
  },
  {
    icon: Shield,
    title: "Fully Decentralized",
    description: "Non-custodial trading with transparent on-chain resolution",
  },
  {
    icon: Clock,
    title: "24/7 Markets",
    description: "Trade anytime, from anywhere in the world",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "No geographic restrictions, open to all traders",
  },
];

export function Features() {
  return (
    <section className="py-16 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-card/50 border border-border/50"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
