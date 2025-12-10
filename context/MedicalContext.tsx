import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalysisData, FileData, Language, UserSettings, HistoryItem, ChatMessage } from '../types';
import { analyzeDocument, initializeChat, setCustomApiKey, sendChatMessage } from '../services/geminiService';

interface MedicalContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fileData: FileData | null;
  analysisData: AnalysisData | null;
  isAnalyzing: boolean;
  error: string | null;
  handleFileUpload: (data: FileData) => void;
  resetApp: () => void;
  settings: UserSettings;
  updateSettings: (settings: UserSettings) => void;
  prefilledMessage: string;
  setPrefilledMessage: (msg: string) => void;
  
  // History & Comparison
  history: HistoryItem[];
  deleteHistoryItem: (id: string) => void;
  compareItems: HistoryItem[]; // Max 2 items
  setCompareItems: (items: HistoryItem[]) => void;
  loadHistoryItem: (id: string) => void; // New function

  // Global Chat State
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendUserMessage: (text: string) => Promise<void>;
  addSystemMessage: (text: string) => void;
}

const MedicalContext = createContext<MedicalContextType | undefined>(undefined);

export const MedicalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  
  // Cache to store analysis results per language for the current file
  const [analysisCache, setAnalysisCache] = useState<Partial<Record<Language, AnalysisData>>>({});
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledMessage, setPrefilledMessage] = useState('');
  
  // Chat State lifted to Context
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [settings, setSettingsState] = useState<UserSettings>(() => {
    const stored = localStorage.getItem('userSettings');
    return stored ? JSON.parse(stored) : {};
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem('medicalHistory');
    return stored ? JSON.parse(stored) : [];
  });

  // Comparison State
  const [compareItems, setCompareItems] = useState<HistoryItem[]>([]);

  const updateSettings = (newSettings: UserSettings) => {
    setSettingsState(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    if (newSettings.apiKey) {
      setCustomApiKey(newSettings.apiKey);
    }
  };

  useEffect(() => {
    if (settings.apiKey) {
      setCustomApiKey(settings.apiKey);
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('medicalHistory', JSON.stringify(history));
  }, [history]);

  const addToHistory = (fileData: FileData, data: AnalysisData) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: Date.now(),
      fileName: fileData.file.name,
      previewUrl: fileData.previewUrl, 
      data: data,
      documentType: data.documentType
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setCompareItems(prev => prev.filter(item => item.id !== id));
  };

  const loadHistoryItem = (id: string) => {
    const item = history.find(i => i.id === id);
    if (!item) return;

    // Restore Analysis Data
    setAnalysisData(item.data);
    
    // Attempt to reconstruct File Data state
    // Note: We might only have the Base64 preview (if it was an image), not the full original file if it was a PDF.
    const isDataUrl = item.previewUrl && item.previewUrl.startsWith('data:');
    
    setFileData({
      file: new File([], item.fileName), // Dummy file object to satisfy type
      previewUrl: item.previewUrl,
      base64: isDataUrl ? item.previewUrl.split(',')[1] : '', // Extract base64 if available for chat context
      mimeType: item.previewUrl.startsWith('data:image') ? 'image/jpeg' : 'application/pdf'
    });
    
    // Reset other states
    setAnalysisCache({}); 
    setError(null);
    setPrefilledMessage('');
    // We clear chat because this is a "fresh" look at an old result. 
    // (We don't currently save chat history in HistoryItem)
    setChatMessages([]); 
  };

  // --- Chat Logic ---
  const sendUserMessage = async (textInput: string) => {
    if (!textInput.trim() || isChatLoading) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textInput,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // 2. Call API (State updates continue even if user navigates away)
      const responseText = await sendChatMessage(textInput);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: language === 'en' ? "Sorry, I encountered an issue. Please try again." : "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const addSystemMessage = (text: string) => {
    // Only add if chat is empty to prevent duplicates on remount
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: 'init',
        role: 'model',
        text,
        timestamp: Date.now()
      }]);
    }
  };

  const performAnalysis = async (data: FileData, lang: Language) => {
    // Reset chat when analyzing a new file or language switch if needed
    if (!analysisCache[lang]) {
        setChatMessages([]); 
    }

    // 1. Check Cache first
    if (analysisCache[lang]) {
      setAnalysisData(analysisCache[lang]!);
      initializeChat(data.base64, data.mimeType, lang, settings.apiKey);
      return;
    }

    // 2. If not in cache, call API
    setAnalysisData(null); 
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]); // Clear chat for new analysis

    try {
      const result = await analyzeDocument(data.base64, data.mimeType, lang, settings.apiKey);
      
      setAnalysisData(result);
      setAnalysisCache(prev => ({ ...prev, [lang]: result }));
      
      // Auto-save to history on first successful analysis
      addToHistory(data, result);

      initializeChat(data.base64, data.mimeType, lang, settings.apiKey);
    } catch (err) {
      console.error(err);
      setError(
        lang === 'en' 
          ? "Failed to analyze document. Please ensure it is a clear medical image or PDF." 
          : "Không thể phân tích tài liệu. Vui lòng đảm bảo hình ảnh hoặc PDF rõ ràng."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (data: FileData) => {
    setFileData(data);
    setAnalysisData(null);
    setAnalysisCache({}); 
    // Chat reset happens in performAnalysis
    performAnalysis(data, language);
  };

  const updateLanguage = (newLang: Language) => {
    setLanguage(newLang);
    if (fileData && !isAnalyzing) {
      performAnalysis(fileData, newLang);
    }
  };

  const resetApp = () => {
    setFileData(null);
    setAnalysisData(null);
    setAnalysisCache({}); 
    setError(null);
    setPrefilledMessage('');
    setChatMessages([]); // Clear chat
    setIsChatLoading(false);
  };

  return (
    <MedicalContext.Provider value={{
      language,
      setLanguage: updateLanguage,
      fileData,
      analysisData,
      isAnalyzing,
      error,
      handleFileUpload,
      resetApp,
      settings,
      updateSettings,
      prefilledMessage,
      setPrefilledMessage,
      history,
      deleteHistoryItem,
      compareItems,
      setCompareItems,
      loadHistoryItem,
      // Chat
      chatMessages,
      isChatLoading,
      sendUserMessage,
      addSystemMessage
    }}>
      {children}
    </MedicalContext.Provider>
  );
};

export const useMedical = () => {
  const context = useContext(MedicalContext);
  if (context === undefined) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
};