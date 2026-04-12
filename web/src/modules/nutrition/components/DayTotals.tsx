"use client";

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minerals?: number;
  vitamins?: number;
}

interface DayTotalsProps {
  totals: Totals;
}

export function DayTotals({ totals }: DayTotalsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 bg-surface border border-white/10 rounded-xl p-4 shadow-lg shadow-black/20">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Calorias</p>
        <p className="text-xl font-black text-foreground">{Math.round(totals.calories)}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Proteína</p>
        <p className="text-xl font-black text-emerald-400">{Math.round(totals.protein)}g</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Carbs</p>
        <p className="text-xl font-black text-blue-400">{Math.round(totals.carbs)}g</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Gorduras</p>
        <p className="text-xl font-black text-yellow-400">{Math.round(totals.fat)}g</p>
      </div>
    </div>
  );
}
