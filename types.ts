export type Language = 'en' | 'vi';

export interface MedicalTestResult {
  test: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'borderline';
  explanation: string;
}

export interface AnalysisData {
  summary: string;
  results: MedicalTestResult[];
  abnormalFindings: string[];
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}