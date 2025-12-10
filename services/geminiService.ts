import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisData, Language, ChatMessage } from "../types";

// Helper to get client (handling dynamic API key)
const getAiClient = (customKey?: string) => {
  const key = customKey || process.env.API_KEY;
  if (!key) {
    console.warn("No API Key available");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Allow setting a global key for the session if needed, though usually passed per request
export const setCustomApiKey = (key: string) => {
  // Logic handled in getAiClient
};

// Schema for the structured analysis output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      enum: ["Blood Test", "Urinalysis", "Prescription", "Radiology Report", "Discharge Summary", "Other"],
      description: "Classify the type of medical document.",
    },
    summary: {
      type: Type.STRING,
      description: "High-level summary (2-4 sentences) explaining the overall health picture in simple language.",
    },
    overallRiskLevel: {
      type: Type.STRING,
      enum: ["low", "moderate", "high", "critical"],
      description: "Overall health risk assessment based on the aggregate of abnormal findings.",
    },
    overallRiskScore: {
      type: Type.NUMBER,
      description: "A calculated risk score from 0 (Perfect health) to 100 (Critical condition).",
    },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          test: { type: Type.STRING, description: "The name of the test or measurement." },
          value: { type: Type.STRING, description: "The raw value string found in document." },
          normalRange: { type: Type.STRING, description: "The reference range string provided." },
          status: { 
            type: Type.STRING, 
            enum: ["normal", "high", "low", "abnormal", "borderline", "unknown", "critical"],
            description: "The status based strictly on the reference range." 
          },
          severity: {
            type: Type.STRING,
            enum: ["none", "mild", "moderate", "concerning", "critical"],
            description: "Severity of the abnormality. 'none' if normal.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score (0-100) regarding the extraction accuracy.",
          },
          explanation: { type: Type.STRING, description: "Simple explanation (EL5) for the patient." },
          technicalExplanation: { type: Type.STRING, description: "Detailed medical explanation for a doctor." },
          notes: { type: Type.STRING, description: "Specific data warnings (e.g., 'Unit mismatch', 'Impossible value >10x')." },
          
          // Numeric fields for visualization
          numericValue: { type: Type.NUMBER, description: "Parsed numeric value of the result. Null if non-numeric." },
          rangeLow: { type: Type.NUMBER, description: "Lower bound of the reference range. 0 if not specified." },
          rangeHigh: { type: Type.NUMBER, description: "Upper bound of the reference range." },
          unit: { type: Type.STRING, description: "Unit of measurement (e.g., mg/dL)." },
        },
        required: ["test", "value", "status", "explanation", "confidence"],
      },
    },
    abnormalFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of abnormal values that need attention.",
    },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 questions the patient should ask their doctor.",
    },
    errorsDetected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of general range mistakes, unit mismatches, or unreadable fields.",
    },
    // New Features
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            enum: ['Medical', 'Diet', 'Lifestyle', 'Data Verification', 'Other'],
            description: "Category of the action."
          },
          priority: { 
            type: Type.STRING, 
            enum: ['High', 'Medium', 'Low'],
            description: "Urgency of the action."
          },
          action: { type: Type.STRING, description: "Short, clear action step (max 15 words)." }
        },
        required: ["category", "priority", "action"]
      },
      description: "A consolidated list of recommended actions."
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The medical term." },
          definition: { type: Type.STRING, description: "Simple 1-sentence definition." }
        },
        required: ["term", "definition"]
      },
      description: "Definitions for complex terms found in the document."
    },
    printableReport: {
      type: Type.STRING,
      description: "A professionally formatted Markdown string containing Summary, Risk Score, List of Abnormalities, and Action Plan. Ready for export."
    }
  },
  required: ["documentType", "summary", "results", "abnormalFindings", "suggestedQuestions", "overallRiskLevel", "overallRiskScore", "actionPlan", "glossary", "printableReport"],
};

export const analyzeDocument = async (
  base64Data: string,
  mimeType: string,
  language: Language,
  apiKey?: string
): Promise<AnalysisData> => {
  try {
    const ai = getAiClient(apiKey);
    const langName = language === 'vi' ? 'Vietnamese' : 'English';
    const prompt = `
      You are an advanced medical diagnostic assistant API. 
      Output Language: ${langName}

      TASK: Analyze the provided medical document (Lab Results, Report, etc.) and return a structured JSON response.

      IMPORTANT - CLASSIFICATION:
      - You MUST classify the document into one of these types: "Blood Test", "Urinalysis", "Prescription", "Radiology Report", "Discharge Summary", or "Other".

      SAFETY & ACCURACY RULES:
      1. **10x Outlier Check**: If a value is >10x the upper limit of the normal range, flag it as 'critical' status and add a note: "Possible OCR/Data error: Value is >10x normal limit."
      2. **Unit Consistency**: Check if units match (e.g., result in mg/dL vs range in mmol/L). If mismatched, set status 'unknown' and note it.
      3. **Impossible Values**: If a value is biologically impossible (e.g., pH 14 in blood), flag as error.
      4. **No Diagnosis**: Do not provide a diagnosis. Only interpret the data relative to the provided ranges.

      DUAL MODE EXPLANATION:
      - For each result, provide TWO explanations:
        1. 'explanation': Simple, non-medical language (for a 12-year-old).
        2. 'technicalExplanation': Clinical terminology and physiological context (for a doctor).

      VISUALIZATION DATA:
      - Extract 'numericValue', 'rangeLow', and 'rangeHigh' whenever possible to allow drawing charts.
      - If range is "< 5.0", rangeLow = 0, rangeHigh = 5.0.
      
      RISK ASSESSMENT:
      - Calculate an 'overallRiskScore' (0-100) based on the number and severity of abnormal results.
      - Assign 'overallRiskLevel': 'low' (all normal), 'moderate' (minor issues), 'high' (concerning values), 'critical' (urgent values).

      ACTION PLAN GENERATION:
      - Generate a structured 'actionPlan' based on abnormal/critical findings.
      - **Merge & Consolidate**: Group duplicate or related actions (e.g., combine multiple diet advice into one).
      - **Categorization Rule**: Group into 'Medical', 'Diet', 'Lifestyle', or 'Data Verification'.
      - **Priority Rule**: Sort High -> Medium -> Low.
      - **Clarity**: Keep actions short, specific, and actionable.

      SMART GLOSSARY:
      - Identify 3-5 complex terms (e.g. Leukocytes, Creatinine) and define them simply.

      EXPORT PREPARATION:
      - Fill 'printableReport' with a clean Markdown formatted string. 
      - Include: Patient Summary, Risk Score, Bullet list of Abnormal Findings, and the consolidated Action Plan.
      - Do not use JSON syntax in 'printableReport'.

      Analyze the attached image/PDF and return the JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.0, // Zero temp for maximum data extraction accuracy
      },
    });

    if (!response.text) {
      throw new Error("No response generated");
    }

    return JSON.parse(response.text) as AnalysisData;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

let chatSession: Chat | null = null;

const SYSTEM_INSTRUCTION = "You are a helpful, empathetic medical interpreter. You support two modes: Simple (patient-friendly) and Technical (doctor-friendly). Adjust your tone based on the user's questions. Always prioritize safety and refuse diagnosis.";

export const initializeChat = (base64Data: string, mimeType: string, language: Language, apiKey?: string) => {
  const ai = getAiClient(apiKey);
  const langName = language === 'vi' ? 'Vietnamese' : 'English';
  
  chatSession = ai.chats.create({
    model: "gemini-3-pro-preview",
    history: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `This is my medical document. I may have follow-up questions. Please answer in ${langName}.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `I have analyzed your document. I am ready to answer your questions in ${langName}. I am an AI, not a doctor.`,
          },
        ],
      },
    ],
    config: {
        systemInstruction: SYSTEM_INSTRUCTION
    }
  });
};

export const restoreChatSession = (
  base64Data: string, 
  mimeType: string, 
  language: Language, 
  chatHistory: ChatMessage[],
  apiKey?: string
) => {
  const ai = getAiClient(apiKey);
  const langName = language === 'vi' ? 'Vietnamese' : 'English';

  // Reconstruct history
  // Start with the Document context
  const historyParts: any[] = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: `This is my medical document. I may have follow-up questions. Please answer in ${langName}.`,
        },
      ],
    }
    // Note: We do NOT hardcode the initial model response here because 
    // the restored chatHistory likely contains the model's greeting/initial response.
    // If we added it, we'd have duplicate model messages.
  ];

  // Append existing messages
  chatHistory.forEach(msg => {
    historyParts.push({
      role: msg.role,
      parts: [{ text: msg.text }]
    });
  });

  chatSession = ai.chats.create({
    model: "gemini-3-pro-preview",
    history: historyParts,
    config: {
        systemInstruction: SYSTEM_INSTRUCTION
    }
  });
};

export const sendChatMessage = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  const result = await chatSession.sendMessage({ message });
  return result.text || "I'm sorry, I couldn't understand that.";
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};