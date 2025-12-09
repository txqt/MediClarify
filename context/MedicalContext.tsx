import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisData, FileData, Language } from '../types';
import { analyzeDocument, initializeChat } from '../services/geminiService';

interface MedicalContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fileData: FileData | null;
  analysisData: AnalysisData | null;
  isAnalyzing: boolean;
  error: string | null;
  handleFileUpload: (data: FileData) => void;
  resetApp: () => void;
}

const MedicalContext = createContext<MedicalContextType | undefined>(undefined);

export const MedicalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (data: FileData, lang: Language) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // 1. Get structured JSON Analysis
      const result = await analyzeDocument(data.base64, data.mimeType, lang);
      setAnalysisData(result);

      // 2. Initialize Chat Session for Q&A context
      initializeChat(data.base64, data.mimeType, lang);
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
    setAnalysisData(null); // Clear previous results
    performAnalysis(data, language);
  };

  const updateLanguage = (newLang: Language) => {
    setLanguage(newLang);
    // If we have a file and results, re-analyze in the new language automatically
    if (fileData && !isAnalyzing) {
      performAnalysis(fileData, newLang);
    }
  };

  const resetApp = () => {
    setFileData(null);
    setAnalysisData(null);
    setError(null);
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
      resetApp
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
