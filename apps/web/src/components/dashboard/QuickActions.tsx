import Link from 'next/link';
import { type ReactNode } from 'react';

interface QuickAction {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color: 'primary' | 'secondary' | 'accent';
}

const colorClasses = {
  primary: {
    gradient: 'from-primary/20 to-primary/5',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  secondary: {
    gradient: 'from-secondary/20 to-secondary/5',
    text: 'text-secondary',
    border: 'border-secondary/20',
  },
  accent: {
    gradient: 'from-accent/20 to-accent/5',
    text: 'text-accent',
    border: 'border-accent/20',
  },
};

const quickActions: QuickAction[] = [
  {
    title: 'Adicionar Aluno',
    description: 'Cadastrar novo aluno',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    href: '/dashboard/students',
    color: 'primary',
  },
  {
    title: 'Criar Treino',
    description: 'Novo plano de treino',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    href: '/dashboard/workouts',
    color: 'secondary',
  },
  {
    title: 'Criar Dieta',
    description: 'Plano nutricional',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    href: '/dashboard/diets',
    color: 'accent',
  },
  {
    title: 'Ver Relatórios',
    description: 'Analytics e métricas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    href: '/dashboard',
    color: 'primary',
  },
];

export function QuickActions() {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-lg p-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5 transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`${colors.text} p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${colors.text} mb-1`}>{action.title}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
