import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

// Esto pilla la key del nivel en el que está
const ai = new GoogleGenAI({});



async function main() {

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Dime un truco de magia",
        config: {
            systemInstruction:
                "Eres un asesor financiero experto para la app 'Spendly' Tu tono es cercano pero profesional Reglas: 1. Solo respondes preguntas sobre ahorro, presupuestos y economía. 2. Si te preguntan algo fuera de finanzas, di que no puedes ayudar con eso. 3. No des consejos de inversión en bolsa o cripto específicos."
        }
    });
    console.log(response.text);
}

main();
