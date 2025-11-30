import { DietMealItem } from '@meupersonal/core';
import { useEffect, useState } from 'react';

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, quantity: number) => void;
  item: DietMealItem | null;
}

export function EditFoodModal({ isOpen, onClose, onSave, item }: EditFoodModalProps) {
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      setQuantity(item.quantity.toString());
    }
  }, [item, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const newQuantity = parseFloat(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) return;

    onSave(item.id, newQuantity);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-foreground">Editar Quantidade</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-background/50 rounded-lg p-4 border border-white/5">
            <h3 className="font-semibold text-foreground">{item.food?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.food?.calories} kcal por {item.food?.serving_size}{item.food?.serving_unit}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Quantidade ({item.unit})
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
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {item.unit}
              </span>
            </div>
          </div>

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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
