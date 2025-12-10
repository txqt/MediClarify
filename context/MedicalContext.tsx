import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalysisData, FileData, Language, UserSettings, HistoryItem, ChatMessage } from '../types';
import { analyzeDocument, initializeChat, restoreChatSession, setCustomApiKey, sendChatMessage } from '../services/geminiService';

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
  loadHistoryItem: (id: string) => void; 

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
  
  // Track active history item to autosave chat
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

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
    try {
      localStorage.setItem('medicalHistory', JSON.stringify(history));
    } catch (e) {
      console.warn("LocalStorage quota exceeded or error saving history", e);
      // Optional: Logic to trim old history if quota exceeded could go here
    }
  }, [history]);

  // Autosave chat to active history item
  useEffect(() => {
    if (currentHistoryId && chatMessages.length > 0) {
      setHistory(prev => prev.map(item => {
        if (item.id === currentHistoryId) {
          // Check if chat has actually changed to avoid unnecessary renders/updates
          if (JSON.stringify(item.chatHistory) === JSON.stringify(chatMessages)) {
            return item;
          }
          return { ...item, chatHistory: chatMessages };
        }
        return item;
      }));
    }
  }, [chatMessages, currentHistoryId]);

  const addToHistory = (fileData: FileData, data: AnalysisData) => {
    const newId = Date.now().toString();
    const newItem: HistoryItem = {
      id: newId,
      date: Date.now(),
      fileName: fileData.file.name,
      previewUrl: fileData.previewUrl, 
      data: data,
      documentType: data.documentType,
      base64: fileData.base64,
      mimeType: fileData.mimeType,
      chatHistory: [] 
    };
    
    // Set current active ID so future chats save to this item
    setCurrentHistoryId(newId);
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setCompareItems(prev => prev.filter(item => item.id !== id));
    if (currentHistoryId === id) setCurrentHistoryId(null);
  };

  const loadHistoryItem = (id: string) => {
    const item = history.find(i => i.id === id);
    if (!item) return;

    setCurrentHistoryId(item.id);

    // Restore Analysis Data
    setAnalysisData(item.data);
    
    // Attempt to reconstruct File Data state
    const isDataUrl = item.previewUrl && item.previewUrl.startsWith('data:');
    
    setFileData({
      file: new File([], item.fileName), // Dummy file object
      previewUrl: item.previewUrl,
      base64: item.base64 || (isDataUrl ? item.previewUrl.split(',')[1] : ''),
      mimeType: item.mimeType || (item.previewUrl.startsWith('data:image') ? 'image/jpeg' : 'application/pdf')
    });
    
    // Reset other states
    setAnalysisCache({}); 
    setError(null);
    setPrefilledMessage('');
    
    // Restore Chat
    if (item.chatHistory && item.chatHistory.length > 0) {
      setChatMessages(item.chatHistory);
      
      // Restore Gemini Session if base64 is available
      if (item.base64 && item.mimeType) {
        restoreChatSession(
          item.base64, 
          item.mimeType, 
          language, 
          item.chatHistory, 
          settings.apiKey
        );
      }
    } else {
      setChatMessages([]); 
      // Initialize fresh chat if no history exists yet
      if (item.base64 && item.mimeType) {
        initializeChat(item.base64, item.mimeType, language, settings.apiKey);
      }
    }
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
      // 2. Call API 
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
    // Only add if chat is empty
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
    // Reset chat when analyzing a new file
    // Note: If we are just switching language for existing file, maybe keep chat? 
    // For now, simple approach: Clear chat on re-analysis to match language context.
    if (!analysisCache[lang]) {
        setChatMessages([]); 
        setCurrentHistoryId(null); // Will be set in addToHistory
    }

    // 1. Check Cache first
    if (analysisCache[lang]) {
      setAnalysisData(analysisCache[lang]!);
      initializeChat(data.base64, data.mimeType, lang, settings.apiKey);
      // Note: If we had a history ID for this cache, we should theoretically restore it.
      // But simple cache implementation here assumes fresh analysis for now.
      return;
    }

    // 2. If not in cache, call API
    setAnalysisData(null); 
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]); 

    try {
      const result = await analyzeDocument(data.base64, data.mimeType, lang, settings.apiKey);
      
      setAnalysisData(result);
      setAnalysisCache(prev => ({ ...prev, [lang]: result }));
      
      // Auto-save to history
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
    setChatMessages([]); 
    setIsChatLoading(false);
    setCurrentHistoryId(null);
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