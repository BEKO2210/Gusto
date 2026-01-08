
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

export interface ShoppingListData {
  dishName: string;
  servings: number;
  ingredients: Ingredient[];
  notes?: string;
}

export interface AppState {
  loading: boolean;
  error: string | null;
  list: ShoppingListData | null;
}
