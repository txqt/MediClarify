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

export interface ActionItem {
  category: 'Medical' | 'Diet' | 'Lifestyle' | 'Data Verification' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  action: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface AnalysisData {
  documentType: 'Blood Test' | 'Urinalysis' | 'Prescription' | 'Radiology Report' | 'Discharge Summary' | 'Other';
  summary: string;
  results: MedicalTestResult[];
  abnormalFindings: string[]; // High-level "Attention Needed" items
  suggestedQuestions: string[];
  errorsDetected: string[]; // General document errors (unreadable, etc.)
  
  // Hackathon Features
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  overallRiskScore: number; // 0-100
  disclaimerNote?: string; // Dynamic safety disclaimer
  
  // New Features
  actionPlan: ActionItem[];
  glossary: GlossaryItem[];
  printableReport: string; // Markdown string
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

export interface HistoryItem {
  id: string;
  date: number; // timestamp
  fileName: string;
  previewUrl: string; // Blob URL or base64 thumbnail
  data: AnalysisData;
  documentType: string;
  
  // Persistence
  base64?: string; // Original file content for chat context
  mimeType?: string;
  chatHistory?: ChatMessage[]; // Saved chat messages
}