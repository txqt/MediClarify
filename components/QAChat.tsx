import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import { Language, AnalysisData } from '../types';
import { useMedical } from '../context/MedicalContext';

interface QAChatProps {
  initialLanguage: Language;
  analysisData: AnalysisData;
}

const QAChat: React.FC<QAChatProps> = ({ initialLanguage, analysisData }) => {
  const { 
    prefilledMessage, 
    setPrefilledMessage,
    chatMessages,
    isChatLoading,
    sendUserMessage,
    addSystemMessage
  } = useMedical();
  
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // State for Dialog Mode
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Small timeout to ensure DOM is rendered before scrolling, especially when expanding
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading, isExpanded]);

  // Handle prefilled message coming from AnalysisResults click
  useEffect(() => {
    if (prefilledMessage) {
      setInput(prefilledMessage);
      setPrefilledMessage(''); 
      // Auto-expand if the user clicked a question to give them a better view
      if (window.innerWidth < 768) {
        setIsExpanded(true); 
      }
    }
  }, [prefilledMessage, setPrefilledMessage]);

  // Initial greeting (handled via Context to prevent dupes)
  useEffect(() => {
    const greeting = initialLanguage === 'en' 
      ? "I've analyzed your document. I cannot provide a diagnosis, but I can explain the results. What would you like to know?"
      : "Tôi đã phân tích tài liệu. Tôi không thể chẩn đoán, nhưng tôi có thể giải thích kết quả. Bạn muốn biết thêm điều gì?";
      
    addSystemMessage(greeting);
  }, [initialLanguage, addSystemMessage]);

  const handleSend = async (textInput: string) => {
    if (!textInput.trim() || isChatLoading) return;
    setInput(''); // Clear input immediately
    await sendUserMessage(textInput); // Delegate to context
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Toggle Function
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Suggestions logic
  const suggestions = analysisData.suggestedQuestions.slice(0, 3).length > 0 
    ? analysisData.suggestedQuestions.slice(0, 3) 
    : (initialLanguage === 'en' ? [
        "What do my abnormal results mean?",
        "Should I be concerned?",
        "What are next steps?"
      ] : [
        "Kết quả bất thường có nghĩa gì?",
        "Tôi có nên lo lắng không?",
        "Bước tiếp theo là gì?"
      ]);

  // Render logic for the internal chat content to be reused in both Portal and Inline modes
  const renderChatContent = (isModal: boolean) => (
    <div className={isModal
      ? "bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10"
      : "flex flex-col h-full w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    }>
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
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
        
        {/* Toggle Button */}
        <button 
          onClick={toggleExpand}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title={isExpanded ? "Minimize" : "Expand Chat"}
        >
          {isExpanded ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
             </svg>
          )}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed overflow-hidden ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown
                    components={{
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-base font-bold text-slate-900 mt-2 mb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-800 mt-2 mb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-slate-800 mt-2 mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-xs" {...props} /></div>,
                      th: ({node, ...props}) => <th className="bg-slate-50 px-2 py-1 text-left font-semibold text-slate-700" {...props} />,
                      td: ({node, ...props}) => <td className="px-2 py-1 border-t border-slate-100" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isChatLoading && (
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

      {/* Suggested Questions Area */}
      {chatMessages.length < 3 && !isChatLoading && (
        <div className="px-4 pb-2 bg-slate-50/50 shrink-0">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
            {initialLanguage === 'en' ? 'Suggested' : 'Gợi ý'}:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all active:scale-95 text-left max-w-full truncate"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={onSubmit} className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={initialLanguage === 'en' ? "Type your question..." : "Nhập câu hỏi..."}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            disabled={isChatLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isChatLoading}
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

  if (isExpanded) {
    // Render portal to document body to break out of any parent transforms/z-indexes
    return (
      <>
        {/* Placeholder in sidebar to prevent layout collapse */}
        <div className="h-[600px] hidden md:flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400 text-sm">
           {initialLanguage === 'en' ? 'Chat Expanded' : 'Chat đã mở rộng'}
        </div>
        
        {createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ margin: 0 }}>
             <div className="absolute inset-0" onClick={toggleExpand}></div>
             {renderChatContent(true)}
          </div>,
          document.body
        )}
      </>
    );
  }

  // Normal Sidebar Render
  return (
    <div className="h-[600px] animate-fade-in">
      {renderChatContent(false)}
    </div>
  );
};

export default QAChat;