'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (role: 'personal_trainer' | 'nutritionist') => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleContinue = () => {
    if (selectedRoles.length === 0) return;
    const rolesParam = selectedRoles.join(',');
    router.push(`/auth/register?role=${rolesParam}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-4xl w-full mx-4">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Como você atua?
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha um ou ambos os perfis para continuar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Personal Trainer Card */}
          <button
            onClick={() => toggleRole('personal_trainer')}
            className={`group relative bg-white/5 backdrop-blur-xl border rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 ${
              selectedRoles.includes('personal_trainer')
                ? 'border-primary bg-primary/10 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]'
                : 'border-white/10 hover:border-primary/50 hover:bg-white/10'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent transition-opacity rounded-2xl ${
              selectedRoles.includes('personal_trainer') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`} />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">
                  💪
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedRoles.includes('personal_trainer')
                    ? 'border-primary bg-primary text-black'
                    : 'border-muted-foreground'
                }`}>
                  {selectedRoles.includes('personal_trainer') && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Personal Trainer</h2>
                <p className="text-muted-foreground">
                  Gerencie treinos, alunos e acompanhe a evolução física. Acesso completo às ferramentas de prescrição de exercícios.
                </p>
              </div>
            </div>
          </button>

          {/* Nutritionist Card */}
          <button
            onClick={() => toggleRole('nutritionist')}
            className={`group relative bg-white/5 backdrop-blur-xl border rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 ${
              selectedRoles.includes('nutritionist')
                ? 'border-secondary bg-secondary/10 shadow-[0_0_30px_-10px_rgba(var(--secondary),0.3)]'
                : 'border-white/10 hover:border-secondary/50 hover:bg-white/10'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent transition-opacity rounded-2xl ${
              selectedRoles.includes('nutritionist') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`} />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-xl bg-secondary/20 flex items-center justify-center text-3xl">
                  🍎
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedRoles.includes('nutritionist')
                    ? 'border-secondary bg-secondary text-black'
                    : 'border-muted-foreground'
                }`}>
                  {selectedRoles.includes('nutritionist') && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Nutricionista</h2>
                <p className="text-muted-foreground">
                  Prescreva dietas, acompanhe refeições e evolução nutricional. Ferramentas especializadas para nutrição.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleContinue}
            disabled={selectedRoles.length === 0}
            className="w-full max-w-md py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            Continuar Cadastro
          </button>
          
          <button 
            onClick={() => router.push('/auth/login')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}
