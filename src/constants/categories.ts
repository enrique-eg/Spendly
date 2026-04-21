export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Comida', icon: 'restaurant' },
  { id: 'shopping', label: 'Compras online', icon: 'shopping_cart' },
  { id: 'clothing', label: 'Ropa', icon: 'shopping_bag' },
  { id: 'entertainment', label: 'Entretenimiento', icon: 'theaters' },
  { id: 'utilities', label: 'Servicios', icon: 'home' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Nómina', icon: 'business_center' },
  { id: 'returns', label: 'Devoluciones', icon: 'undo' },
  { id: 'freelance', label: 'Freelance', icon: 'work' },
  { id: 'investment', label: 'Inversión', icon: 'trending_up' },
  { id: 'other_income', label: 'Otro ingreso', icon: 'add_circle' },
];

export function getCategoriesByType(type: 'income' | 'expense' | 'transfer') {
  if (type === 'income') {
    return INCOME_CATEGORIES;
  }
  if (type === 'expense') {
    return EXPENSE_CATEGORIES;
  }
  return [];
}

export function getCategoryLabel(categoryId: string | null | undefined, type: 'income' | 'expense' | 'transfer'): string {
  if (!categoryId) return 'Uncategorized';
  
  const categories = getCategoriesByType(type);
  const category = categories.find(c => c.id === categoryId);
  return category?.label || 'Uncategorized';
}
