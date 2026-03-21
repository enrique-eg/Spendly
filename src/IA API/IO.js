import { GoogleGenAI } from "https://esm.run/@google/genai";

// Esto pilla la key del nivel en el que está
const ai = new GoogleGenAI({ apiKey: "AIzaSyANBJCIDpEpqVOCO8XrMUuPhv6pF7BgmPw" });


export async function createChat() {
    const chat = await ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: "Eres un asesor financiero experto para la app 'Spendly'. Tu tono es cercano pero profesional. Reglas: 1. Solo respondes preguntas sobre ahorro, presupuestos y economía. 2. Si te preguntan algo fuera de finanzas, di que no puedes ayudar con eso. 3. No des consejos de inversión en bolsa o cripto específicos."

        },
    });

    const datos = "Usuario ejemplo";




    return chat;
}

export async function enviarMensaje(chat, mensaje) {
    mostrarMensajeEnPantalla("Usuario", mensaje);

    const respuesta = await chat.sendMessage({
        message: mensaje
    });

    mostrarMensajeEnPantalla("SpendlyGPT", respuesta.text);
}

function mostrarMensajeEnPantalla(autor, texto) {
    const chatBox = document.getElementById("chat-box");

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("mensaje", autor.toLowerCase()); // Para dar estilos luego

    // Usamos innerText para seguridad, o un conversor de Markdown si quieres negritas
    msgDiv.innerHTML = `<strong>${autor}:</strong> ${texto}`;

    chatBox.appendChild(msgDiv);

    // Auto-scroll hacia abajo para ver el último mensaje
    chatBox.scrollTop = chatBox.scrollHeight;
}

/*
//Función para pruebas
async function main()
{
    const ChatActual = await createChat();
    enviarMensaje(ChatActual, "Hola, recomiendame como ahorrar")

}
*/
//main();
