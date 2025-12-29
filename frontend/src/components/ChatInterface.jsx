import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, Zap, Search, Brain } from 'lucide-react';

const AIProviders = {
  CHATGPT: { id: 'chatgpt', name: 'ChatGPT', icon: Brain, color: 'from-green-400 to-cyan-500' },
  GROK: { id: 'grok', name: 'Grok', icon: Zap, color: 'from-purple-400 to-blue-500' },
  OPENROUTER: { id: 'openrouter', name: 'OPENROUTER', icon: Sparkles, color: 'from-orange-400 to-pink-500' },
  // PERPLEXITY: { id: 'perplexity', name: 'Perplexity', icon: Search, color: 'from-blue-400 to-indigo-500' }
};

// Helper to get provider by id
const getProviderById = (id) => {
  return Object.values(AIProviders).find(p => p.id === id) || AIProviders.CHATGPT;
};

export default function MultiAIChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedAI, setSelectedAI] = useState('CHATGPT');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Replace this URL with your FastAPI backend endpoint
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          provider: selectedAI.toLowerCase(),
          conversation_history: messages
        })
      });

      const data = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response || 'Sorry, I encountered an error.',
        sender: 'ai',
        provider: AIProviders[selectedAI].id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Failed to connect to backend. Make sure your FastAPI server is running on http://localhost:8000',
        sender: 'ai',
        provider: AIProviders[selectedAI].id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-8 h-8" />
            Multi-AI Chatbot
          </h1>
          
          {/* AI Provider Selector */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(AIProviders).map(([key, provider]) => {
              const Icon = provider.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedAI(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedAI === key
                      ? `bg-gradient-to-r ${provider.color} text-white shadow-lg scale-105`
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {provider.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white/50 mt-20">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Select an AI provider and start chatting!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/10 backdrop-blur-lg text-white border border-white/20'
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                    {React.createElement(getProviderById(message.provider).icon, { className: 'w-3 h-3' })}
                    {getProviderById(message.provider).name}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                <div className="text-xs opacity-50 mt-1">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${AIProviders[selectedAI].name} anything...`}
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`px-6 rounded-xl bg-gradient-to-r ${AIProviders[selectedAI].color} text-white font-semibold transition-all ${
              isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}