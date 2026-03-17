import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

// Esto pilla la key del nivel en el que está
const ai = new GoogleGenAI({});


async function createChat() {
    const chat = await ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: "Eres un asesor financiero experto para la app 'Spendly'..."
        },
    });

    const datos = "Usuario ejemplo";

    const respuesta = await chat.sendMessage({
        message: `Hola, estos son los datos del usuario ${datos}. Responde: Bienvenido ${datos}, ¿como puedo ayudarte?`
    });

    console.log(respuesta.text);

    return chat;
}

async function sendMessage(chat, mensaje) {
    const respuesta = await chat.sendMessage({
        message: mensaje
    });

    console.log(respuesta.text);


    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.textContent = respuesta.text;

    chatBox.appendChild(msg);
}
