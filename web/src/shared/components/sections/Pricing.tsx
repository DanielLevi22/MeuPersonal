'use client';

import { useState } from 'react';

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-surface/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            PLANOS <span className="text-primary">FLEXÍVEIS</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Escolha o plano ideal para o seu momento.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>Mensal</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-white/10 rounded-full relative transition-colors hover:bg-white/20"
            >
              <div className={`absolute top-1 w-5 h-5 bg-primary rounded-full transition-all ${isAnnual ? 'left-8' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
              Anual <span className="text-primary text-xs ml-1">(Desconto)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-surface border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold mb-2">Gratuito</h3>
            <div className="text-3xl font-bold mb-6">R$ 0<span className="text-sm text-muted-foreground font-normal">/mês</span></div>
            <ul className="space-y-4 mb-8 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">✓ 1 Aluno</li>
              <li className="flex items-center gap-2">✓ Treinos Básicos</li>
              <li className="flex items-center gap-2">✓ App do Aluno</li>
            </ul>
            <button className="w-full py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              Começar Grátis
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-surface border border-primary/50 rounded-2xl p-8 relative transform scale-105 shadow-2xl shadow-primary/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="text-3xl font-bold mb-6">
              R$ {isAnnual ? '49' : '59'}
              <span className="text-sm text-muted-foreground font-normal">/mês</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 text-foreground">✓ Até 20 Alunos</li>
              <li className="flex items-center gap-2 text-foreground">✓ Treinos Ilimitados</li>
              <li className="flex items-center gap-2 text-foreground">✓ Avaliação Física</li>
              <li className="flex items-center gap-2 text-foreground">✓ Chat Integrado</li>
            </ul>
            <button className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Assinar Pro
            </button>
          </div>

          {/* Unlimited Plan */}
          <div className="bg-surface border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold mb-2">Ilimitado</h3>
            <div className="text-3xl font-bold mb-6">
              R$ {isAnnual ? '99' : '119'}
              <span className="text-sm text-muted-foreground font-normal">/mês</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">✓ Alunos Ilimitados</li>
              <li className="flex items-center gap-2">✓ Tudo do Pro</li>
              <li className="flex items-center gap-2">✓ Site Personalizado</li>
              <li className="flex items-center gap-2">✓ Gestão Financeira</li>
            </ul>
            <button className="w-full py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              Assinar Ilimitado
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
