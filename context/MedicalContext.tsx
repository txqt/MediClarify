import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalysisData, FileData, Language, UserSettings, HistoryItem } from '../types';
import { analyzeDocument, initializeChat, setCustomApiKey } from '../services/geminiService';

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
      previewUrl: fileData.previewUrl, // Note: Blob URLs might expire if not handled, but for this session it's ok. For permanent storage, IndexedDB is better for images.
      data: data,
      documentType: data.documentType
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setCompareItems(prev => prev.filter(item => item.id !== id));
  };

  const performAnalysis = async (data: FileData, lang: Language) => {
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
      setCompareItems
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