import { GoogleGenAI, Type } from "@google/genai";
import { ISRTable, Holiday } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class GeminiService {
  /**
   * Fetches the official ISR table for a given year and type using Gemini.
   */
  static async fetchOfficialISRTable(year: number, type: string): Promise<ISRTable | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Proporciona la tabla de ISR oficial de México para el año ${year} con periodicidad ${type}. 
        Asegúrate de que los valores sean precisos según la publicación oficial del SAT.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.NUMBER },
              type: { type: Type.STRING },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lowerLimit: { type: Type.NUMBER },
                    upperLimit: { type: Type.NUMBER },
                    fixedFee: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER }
                  },
                  required: ["lowerLimit", "upperLimit", "fixedFee", "rate"]
                }
              }
            },
            required: ["year", "type", "rows"]
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as ISRTable;
      }
      return null;
    } catch (error) {
      console.error("Error fetching ISR table via Gemini:", error);
      return null;
    }
  }

  /**
   * Fetches the official federal holidays for a given year using Gemini.
   */
  static async fetchOfficialHolidays(year: number): Promise<Holiday[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Proporciona la lista de días festivos oficiales (descanso obligatorio) en México para el año ${year}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                name: { type: Type.STRING },
                isFederal: { type: Type.BOOLEAN }
              },
              required: ["date", "name", "isFederal"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as Holiday[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching holidays via Gemini:", error);
      return [];
    }
  }

  /**
   * Searches for labor law information using Gemini with Google Search.
   */
  static async searchLaborLaw(query: string): Promise<{ text: string, sources: { title: string, uri: string }[] }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Investiga en la Ley Federal del Trabajo de México y fuentes oficiales lo siguiente: ${query}. 
        Proporciona una explicación detallada de los factores involucrados y asegúrate de que la información esté actualizada. 
        Incluye las ligas o referencias de donde se obtiene la información.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No se encontró información.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = chunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Fuente",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri) || [];

      return { text, sources };
    } catch (error) {
      console.error("Error searching labor law via Gemini:", error);
      return { text: "Error al realizar la búsqueda. Por favor intente de nuevo.", sources: [] };
    }
  }
}
