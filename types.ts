export type Language = 'en' | 'vi';

export interface MedicalTestResult {
  test: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'borderline' | 'unknown' | 'critical';
  severity?: 'none' | 'mild' | 'moderate' | 'concerning' | 'critical';
  confidence: number; // 0-100
  explanation: string; // Simple explanation
  technicalExplanation?: string; // Doctor-level explanation
  notes?: string; // For unit mismatches or range errors
  
  // For Visualization
  numericValue?: number;
  rangeLow?: number;
  rangeHigh?: number;
  unit?: string;
}

export interface AnalysisData {
  summary: string;
  results: MedicalTestResult[];
  abnormalFindings: string[]; // High-level "Attention Needed" items
  suggestedQuestions: string[];
  errorsDetected: string[]; // General document errors (unreadable, etc.)
  
  // Hackathon Features
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  overallRiskScore: number; // 0-100
  disclaimerNote?: string; // Dynamic safety disclaimer
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