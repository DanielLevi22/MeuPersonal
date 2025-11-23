"use client";

import { motion } from "framer-motion";
import { cn } from "lib/utils";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: { monthly: "R$ 29", yearly: "R$ 290" },
    description: "Para quem está começando a jornada fitness.",
    features: ["Treinos ilimitados", "Acompanhamento básico", "Suporte por email"],
  },
  {
    name: "Pro",
    price: { monthly: "R$ 59", yearly: "R$ 590" },
    description: "A escolha perfeita para evoluir rápido.",
    features: ["Tudo do Starter", "Dieta personalizada", "Chat com personal", "Analytics avançado"],
    popular: true,
  },
  {
    name: "Business",
    price: { monthly: "R$ 99", yearly: "R$ 990" },
    description: "Para personals que querem escalar.",
    features: ["Tudo do Pro", "Gestão de alunos", "Marca própria (White label)", "Suporte prioritário"],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            PLANOS QUE <span className="text-primary">CABEM NO BOLSO</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Escolha o plano ideal para o seu objetivo. Cancele a qualquer momento.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>
              Mensal
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-8 bg-surface-highlight rounded-full p-1 transition-colors border border-border"
            >
              <motion.div
                className="w-6 h-6 bg-primary rounded-full"
                animate={{ x: isYearly ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={cn("text-sm font-medium transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>
              Anual <span className="text-xs text-primary ml-1">(-20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2",
                plan.popular
                  ? "bg-surface/80 border-primary/50 shadow-[0_0_30px_-10px_rgba(204,255,0,0.3)]"
                  : "bg-surface/30 border-border hover:border-border-light"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-display font-bold">
                  {isYearly ? plan.price.yearly : plan.price.monthly}
                </span>
                <span className="text-muted-foreground text-sm">/{isYearly ? "ano" : "mês"}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-8 h-10">{plan.description}</p>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all",
                  plan.popular
                    ? "bg-primary text-black hover:bg-primary-hover hover:shadow-lg"
                    : "bg-surface-highlight text-foreground hover:bg-white/10"
                )}
              >
                Começar Agora
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
