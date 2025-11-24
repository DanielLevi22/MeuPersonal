import { Food } from '@meupersonal/core';
import { useEffect, useState } from 'react';

interface AddFoodQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  food: Food | null;
  suggestedQuantity?: number;
}

export function AddFoodQuantityModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  food,
  suggestedQuantity 
}: AddFoodQuantityModalProps) {
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (isOpen && suggestedQuantity) {
      setQuantity(Math.round(suggestedQuantity).toString());
    } else if (isOpen) {
      setQuantity('100');
    }
  }, [isOpen, suggestedQuantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!isNaN(qty) && qty > 0) {
      onConfirm(qty);
      setQuantity('');
    }
  };

  if (!isOpen || !food) return null;

  const ratio = parseFloat(quantity || '0') / food.serving_size;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-foreground">Confirmar Quantidade</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-background/50 rounded-lg p-4 border border-white/5">
            <h3 className="font-semibold text-foreground">{food.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {food.calories} kcal por {food.serving_size}{food.serving_unit}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Quantidade ({food.serving_unit})
            </label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-lg font-semibold text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
                autoFocus
                step="any"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {food.serving_unit}
              </span>
            </div>
          </div>

          {parseFloat(quantity || '0') > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Valores nutricionais:</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Calorias</p>
                  <p className="text-sm font-bold text-foreground">{Math.round(food.calories * ratio)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prot</p>
                  <p className="text-sm font-bold text-emerald-400">{Math.round(food.protein * ratio)}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carb</p>
                  <p className="text-sm font-bold text-blue-400">{Math.round(food.carbs * ratio)}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gord</p>
                  <p className="text-sm font-bold text-yellow-400">{Math.round(food.fat * ratio)}g</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
