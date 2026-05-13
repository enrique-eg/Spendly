import React, { useState, useRef, useEffect } from 'react';
import './ai.css';
import BottomNav from '../../components/bottomNav/BottomNav';
import SettingsSidebar from "../../components/settings-sidebar/SettingsSidebar";
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../../context/AuthContext.tsx";

interface Message {
    id: string;
    author: 'User' | 'SpendlyGPT';
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
    const navigate = useNavigate()
    const { user } = useAuth()

    // Initialize chat with Gemini
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');

                const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
                if (!apiKey) {
                    throw new Error('VITE_GOOGLE_API_KEY is not configured in environment variables');
                }
                const genAI = new GoogleGenerativeAI(apiKey);

                const model = genAI.getGenerativeModel({
                    model: 'gemini-3-flash-preview',
                    systemInstruction: `You are an expert financial advisor for the 'Spendly' app. Your tone is friendly but professional.
          
Rules:
1. Only answer questions about savings, budgets, and economics.
2. If asked about non-finance topics, say you can't help with that.
3. Don't give specific investment or crypto advice.
4. Be concise and helpful in your responses.
5. You can ask follow-up questions to better understand the user's financial situation.`
                });

                // Create a chat session
                const chat = model.startChat();

                // Wrapper to maintain compatibility with the expected interface
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
                alert('Error initializing the assistant. Please check your internet connection.');
            }
        };

        initializeChat();
    }, []);

    // Auto-scroll down when there are new messages
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

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            author: 'User',
            text: mensajeInput,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Send message and get response
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
                text: 'Sorry, an error occurred while processing your message. Please try again.',
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
        'How to create a budget',
        'Saving tips',
        'Update food budget',
    ];

    return (
        <div className="spendly-container dark">
            {/* Header */}
            <header className="spendly-header">
                <div className="header-left">
                    <div className="logo-circle">
                        <span className="material-symbols-outlined">wallet</span>
                    </div>
                    <h1 className="header-title">Spendly</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="header-icon-btn profile-btn" onClick={() => navigate('/personal-profile')} aria-label="Profile">
                        <span className="material-symbols-outlined">person</span>
                    </button>
                    <button className="header-icon-btn settings-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
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
                        <h2 className="spendly-empty-title">Hello! 👋</h2>
                        <p className="spendly-empty-description">
                            I'm your financial assistant. I can help you with budgets, savings, and financial advice.
                        </p>
                    </div>
                )}

                {/* Messages */}
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message-container ${
                            message.author === 'User'
                                ? 'user-message'
                                : 'assistant-message'
                        }`}
                    >
                        <div className={`message-avatar ${
                            message.author === 'User'
                                ? 'user-avatar'
                                : 'assistant-avatar'
                        }`}>
                            <span className="material-symbols-outlined">
                                {message.author === 'User' ? 'person' : 'auto_awesome'}
                            </span>
                        </div>
                        <div className={`message-bubble ${
                            message.author === 'User' ? 'user' : 'assistant'
                        }`}>
                            <p className="message-author">
                                {message.author === 'User' ? 'You' : 'Spendly Assistant'}
                            </p>
                            <div className={`message-text ${
                                message.author === 'User' ? 'user' : 'assistant'
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