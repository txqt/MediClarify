import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface QAChatProps {
  initialLanguage: Language;
  documentSummary: string;
}

const QAChat: React.FC<QAChatProps> = ({ initialLanguage, documentSummary }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'init',
        role: 'model',
        text: initialLanguage === 'en' 
          ? "I've analyzed your document. What would you like to know?"
          : "Tôi đã phân tích tài liệu của bạn. Bạn muốn biết thêm điều gì?",
        timestamp: Date.now()
      }]);
    }
  }, [initialLanguage]);

  const handleSend = async (textInput: string) => {
    if (!textInput.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(textInput);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: initialLanguage === 'en' ? "Sorry, I encountered an issue. Please try again." : "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const suggestedQuestions = initialLanguage === 'en' ? [
    "What do my abnormal results mean?",
    "Should I be concerned?",
    "What are next steps?"
  ] : [
    "Kết quả bất thường có nghĩa gì?",
    "Tôi có nên lo lắng không?",
    "Bước tiếp theo là gì?"
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {initialLanguage === 'en' ? 'MediChat Assistant' : 'Trợ lý MediChat'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {initialLanguage === 'en' ? 'Ask about your results...' : 'Hỏi về kết quả của bạn...'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Area - Only show if conversation is new */}
      {messages.length < 3 && !isLoading && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
            {initialLanguage === 'en' ? 'Suggested' : 'Gợi ý'}:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={initialLanguage === 'en' ? "Type your question..." : "Nhập câu hỏi..."}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A2.001 2.001 0 005.692 10H14a1 1 0 010 2H5.692a2.001 2.001 0 00-1.999 1.836l-1.414 4.925a.75.75 0 00.826.95 28.898 28.898 0 0011.17-7.468.75.75 0 000-1.157A28.89 28.89 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default QAChat;