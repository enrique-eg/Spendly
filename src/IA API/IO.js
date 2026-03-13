import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

// Esto pilla la key del nivel en el que está
const ai = new GoogleGenAI({});



async function main() {
    const chat = await ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction:  "Eres un asesor financiero experto para la app 'Spendly' Tu tono es cercano pero profesional Reglas: 1. Solo respondes preguntas sobre ahorro, presupuestos y economía. 2. Si te preguntan algo fuera de finanzas, di que no puedes ayudar con eso. 3. No des consejos de inversión en bolsa o cripto específicos."

        },

    });
    var N_mensaje = 0
    const mensajes = ["recuedame mi objetivo"]
    const Datos_user = "No respondas a este mensaje, es solo información del usuario para el resto del chat. El usuario Gana 1500 euros. Gasta 600 en el alquiler. 100 en luz y agua. 100 en suscripciones de streaming. 300 en comida. ahorra 100 al mes. gasta el resto en hobbies. Su objetivo es ahorrar 10.000 euros."
    await chat.sendMessage({message: Datos_user})
    while (N_mensaje < 1) {
        var response = await chat.sendMessage({message: mensajes[N_mensaje]})
        N_mensaje++
        console.log(response.text)
    }
}

main();
