
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from '../App';
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[550px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span>{title}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-12 px-4 opacity-40">
            <p className="text-sm">Olá! Como posso ajudar com os dados do projeto hoje?</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border shadow-sm'
            }`}>
              <div className="prose prose-sm whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-slate-400 animate-pulse">Pensando...</div>}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Pergunte sobre os projetos..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="absolute right-2 top-2 text-blue-600 disabled:opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
