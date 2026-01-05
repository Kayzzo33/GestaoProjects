
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
// Fix: Import useAuth from AuthContext instead of App
import { useAuth } from '../contexts/AuthContext.tsx';
import { geminiService } from '../geminiService';

interface ChatPanelProps {
  title: string;
  description: string;
  type: 'admin' | 'client';
}

const ChatPanel: React.FC<ChatPanelProps> = ({ title, description, type }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = type === 'admin' 
        ? await geminiService.askAdminAI(user, input) 
        : await geminiService.askClientAI(user, input);

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Houve um erro técnico ao processar sua solicitação.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[550px] overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="tracking-tight">{title}</span>
        </h3>
        <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{description}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 px-6 text-center">
            <svg className="mb-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm font-medium">Olá! Tem alguma dúvida sobre o status ou tecnologia do projeto?</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
              ? 'bg-slate-900 text-white rounded-tr-none shadow-md shadow-slate-200' 
              : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              <div className="prose prose-sm whitespace-pre-wrap font-medium">{m.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex space-x-2 p-4">
             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Digite sua dúvida aqui..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-5 pr-14 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={isTyping}
            className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-30 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;