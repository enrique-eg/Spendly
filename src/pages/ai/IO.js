import { GoogleGenAI } from "https://esm.run/@google/genai";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
    "SUPABAS_PROJECT",
    "SUPABASE_KEY"
);
// Esto pilla la key del nivel en el que está
const ai = new GoogleGenAI({ apiKey: "GOOGLE_API_KEY" });


export async function createChat() {
    const chat = await ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: "Eres un asesor financiero experto para la app 'Spendly'. Tu tono es cercano pero profesional. Reglas: 1. Solo respondes preguntas sobre ahorro, presupuestos y economía. 2. Si te preguntan algo fuera de finanzas, di que no puedes ayudar con eso. 3. No des consejos de inversión en bolsa o cripto específicos."

        },
    });

    const datos = await obtenerDatosUsuario();

    const promptDatos = `
    Datos del usuario:
    ${JSON.stringify(datos)}
    `;

    await chat.sendMessage({
        message: promptDatos
    });



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

async function obtenerDatosUsuario() {
    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", "e2f3ee10-1bf9-4740-a31f-a37736113371")
    console.log(data)
    if (error) {
        console.error(error);
        return null;
    }

    return data;
}
/*
//Función para pruebas
async function main()
{
    const ChatActual = await createChat();
    const respuesta = await ChatActual.sendMessage({message: "Hola, recomiendame como ahorrar"})
    console.log(respuesta.text)

}

main();
*/
