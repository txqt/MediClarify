export type Language = 'en' | 'vi';

export interface MedicalTestResult {
  test: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'borderline' | 'unknown';
  severity?: 'none' | 'mild' | 'moderate' | 'concerning';
  confidence: number; // 0-100
  explanation: string;
  notes?: string; // For unit mismatches or range errors
}

export interface AnalysisData {
  summary: string;
  results: MedicalTestResult[];
  abnormalFindings: string[]; // High-level "Attention Needed" items
  suggestedQuestions: string[];
  errorsDetected: string[]; // General document errors (unreadable, etc.)
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

export interface UserSettings {
  apiKey?: string;
}