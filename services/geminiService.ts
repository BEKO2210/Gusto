
import { GoogleGenAI, Type } from "@google/genai";
import { ShoppingListData } from "../types";

/**
 * Erzeugt eine Einkaufsliste basierend auf Benutzereingaben.
 * Der API_KEY wird aus der Umgebungsvariable process.env.API_KEY bezogen.
 */
export async function generateShoppingList(dish: string, servings: number): Promise<ShoppingListData> {
  // Initialisierung direkt vor dem Call für maximale Aktualität des Keys
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Erstelle eine professionelle Einkaufsliste für "${dish}" für ${servings} Personen.`,
      config: {
        systemInstruction: `Du bist GUSTO, ein hochmoderner Kulinarik-Experte. 
        Deine Mission: Erstelle extrem präzise Einkaufslisten.
        REGELN:
        1. Kategorisiere nach Supermarkt-Logik (z.B. 'Gemüse & Kräuter', 'Fleisch & Fisch', 'Milchprodukte', 'Gewürze & Öle').
        2. Berechne Mengen exakt für die angegebene Personenzahl.
        3. Gib einen kurzen 'Gusto-Tipp' (max 20 Wörter) zur Qualität der Zutaten oder Zubereitung.
        4. Antworte ausschließlich im JSON-Format auf Deutsch.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING },
            servings: { type: Type.NUMBER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["name", "quantity", "unit", "category"]
              }
            },
            notes: { type: Type.STRING }
          },
          required: ["dishName", "servings", "ingredients"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Keine Daten erhalten.");
    
    return JSON.parse(text) as ShoppingListData;
  } catch (error) {
    console.error("GUSTO API Error:", error);
    throw new Error("GUSTO konnte die Liste nicht erstellen. Prüfen Sie die API-Konfiguration.");
  }
}
