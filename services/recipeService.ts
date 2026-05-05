import { ShoppingListData } from '../types';

export async function generateShoppingList(
  dish: string,
  servings: number,
): Promise<ShoppingListData> {
  const res = await fetch('/api/recipe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dish, servings }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(
      detail || `GUSTO konnte die Liste nicht erstellen (HTTP ${res.status}).`,
    );
  }

  return (await res.json()) as ShoppingListData;
}
