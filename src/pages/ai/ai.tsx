import React, { useState, useRef, useEffect } from 'react';
import './ai.css';
import BottomNav from '../../components/bottomNav/BottomNav';
import SettingsSidebar from "../../components/settings-sidebar/SettingsSidebar";
import {useAuth} from "../../context/AuthContext.tsx";

interface Message {
    id: string;
    author: 'Usuario' | 'SpendlyGPT';
    text: string;
    timestamp: Date;
}

interface ChatType {
    sendMessage: (input: { message: string }) => Promise<{ text: string }>;
}

export default function SpendlyAIAssistant() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
    const [initialized, setInitialized] = useState(false);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const [showSettings, setShowSettings] = useState(false)
    const { user } = useAuth()

    // Inicializar el chat con Gemini
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');

                const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
                if (!apiKey) {
                    throw new Error('VITE_GOOGLE_API_KEY no está configurada en las variables de entorno');
                }
                const genAI = new GoogleGenerativeAI(apiKey);

                const model = genAI.getGenerativeModel({
                    model: 'gemini-3-flash-preview',
                    systemInstruction: `Eres un asesor financiero experto para la app 'Spendly'. Tu tono es cercano pero profesional.
          
Reglas:
1. Solo respondes preguntas sobre ahorro, presupuestos y economía.
2. Si te preguntan algo fuera de finanzas, di que no puedes ayudar con eso.
3. No des consejos de inversión en bolsa o cripto específicos.
4. Sé conciso y útil en tus respuestas.
5. Puedes hacer preguntas de seguimiento para entender mejor la situación financiera del usuario.`
                });

                // Crear una sesión de chat
                const chat = model.startChat();

                // Wrapper para mantener compatibilidad con la interfaz esperada
                const chatWrapper = {
                    sendMessage: async (input: { message: string }) => {
                        const result = await chat.sendMessage(input.message);
                        const response = await result.response;
                        return { text: response.text() };
                    }
                };

                setCurrentChat(chatWrapper);
                setInitialized(true);
            } catch (error) {
                console.error('Error initializing chat:', error);
                alert('Error al inicializar el asistente. Verifica tu conexión a internet.');
            }
        };

        initializeChat();
    }, []);

    // Auto-scroll hacia abajo cuando hay nuevos mensajes
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        const mensajeInput = input.trim();

        if (!mensajeInput || !currentChat) {
            return;
        }

        // Agregar mensaje del usuario
        const userMessage: Message = {
            id: Date.now().toString(),
            author: 'Usuario',
            text: mensajeInput,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Enviar mensaje y obtener respuesta
            const respuesta = await currentChat.sendMessage({
                message: mensajeInput,
            });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                author: 'SpendlyGPT',
                text: respuesta.text,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                author: 'SpendlyGPT',
                text: 'Disculpa, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickSuggestion = (suggestion: string) => {
        setInput(suggestion);
    };

    const quickSuggestions = [
        'Cómo crear un presupuesto',
        'Consejos de ahorro',
        'Actualizar presupuesto de comida',
    ];

    return (
        <div className="spendly-container dark">
            {/* Header */}
            <header className="spendly-header">
                <h1 className="header-title">Spendly Assistant</h1>
                <button className="header-settings-btn" onClick={() => setShowSettings(true)}>
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </header>

            {/* Settings Sidebar */}
            <SettingsSidebar
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                userId={user?.id || ''}
                defaultCurrency={''}
                onDefaultCurrencyChange={() => {}}
            />
            {/* Chat Area */}
            <main ref={chatBoxRef} className="spendly-chat-area">
                {messages.length === 0 && (
                    <div className="spendly-empty-state">
                        <div className="spendly-empty-icon">
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <h3 className="spendly-empty-title">¡Hola! 👋</h3>
                        <p className="spendly-empty-description">
                            Soy tu asistente financiero. Puedo ayudarte con presupuestos, ahorro y consejos financieros.
                        </p>
                    </div>
                )}

                {/* Mensajes */}
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message-container ${
                            message.author === 'Usuario'
                                ? 'user-message'
                                : 'assistant-message'
                        }`}
                    >
                        <div className={`message-avatar ${
                            message.author === 'Usuario'
                                ? 'user-avatar'
                                : 'assistant-avatar'
                        }`}>
                            <span className="material-symbols-outlined">
                                {message.author === 'Usuario' ? 'person' : 'auto_awesome'}
                            </span>
                        </div>
                        <div className={`message-bubble ${
                            message.author === 'Usuario' ? 'user' : 'assistant'
                        }`}>
                            <p className="message-author">
                                {message.author === 'Usuario' ? 'You' : 'Spendly Assistant'}
                            </p>
                            <div className={`message-text ${
                                message.author === 'Usuario' ? 'user' : 'assistant'
                            }`}>
                                {message.text}
                            </div>
                            <p className="message-timestamp">
                                {message.timestamp.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>


                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="loading-container">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                    </div>
                )}
            </main>

            {/* Quick Suggestions */}
            {messages.length < 2 && !isLoading && (
                <div className="spendly-suggestions">
                    {quickSuggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickSuggestion(suggestion)}
                            className="suggestion-btn"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            {/* Input Area */}
            <div className="spendly-input-area">
                <div className="spendly-input-wrapper">
                    <input
                        className="spendly-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!initialized || isLoading}
                        placeholder={initialized ? 'Ask Spendly anything...' : 'Initializing...'}
                        type="text"
                    />
                    <button
                        className="input-send-btn"
                        onClick={handleSendMessage}
                        disabled={!initialized || isLoading || !input.trim()}
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>


            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}