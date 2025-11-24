import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'accent';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
}

const colorClasses = {
  primary: {
    text: 'text-primary',
    glow: 'shadow-primary/50',
    bg: 'bg-primary/10',
  },
  secondary: {
    text: 'text-secondary',
    glow: 'shadow-secondary/50',
    bg: 'bg-secondary/10',
  },
  accent: {
    text: 'text-accent',
    glow: 'shadow-accent/50',
    bg: 'bg-accent/10',
  },
};

export function StatCard({ title, value, icon, color, trend, loading }: StatCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-10 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-4xl font-bold ${colors.text}`}>{value}</h3>
            {trend && (
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`${colors.bg} ${colors.text} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
