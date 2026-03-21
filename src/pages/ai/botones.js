import {createChat, enviarMensaje} from "./IO.js";

let currentChat = null;


// BOTÓN: Enviar mensaje
document.getElementById("sendBtn").addEventListener("click", async () => {
    const input = document.getElementById("userInput");
    const mensaje = input.value;

    if (!currentChat) {
        currentChat = await createChat();
    }

    if (!mensaje) return;

    await enviarMensaje(currentChat, mensaje);

    input.value = ""; // limpiar input
});

document.getElementById("userInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("sendBtn").click();
    }
});