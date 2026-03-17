let currentChat = null;

// BOTÓN: Comenzar chat
document.getElementById("startChatBtn").addEventListener("click", async () => {
    currentChat = await createChat();
});

// BOTÓN: Enviar mensaje
document.getElementById("sendBtn").addEventListener("click", async () => {
    const input = document.getElementById("userInput");
    const mensaje = input.value;

    if (!mensaje || !currentChat) return;

    await sendMessage(currentChat, mensaje);

    input.value = ""; // limpiar input
});