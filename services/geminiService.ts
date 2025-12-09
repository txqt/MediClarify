import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisData, Language } from "../types";

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
    summary: {
      type: Type.STRING,
      description: "High-level summary (2-4 sentences) explaining the overall health picture in simple language.",
    },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          test: { type: Type.STRING, description: "The name of the test or measurement." },
          value: { type: Type.STRING, description: "The value found." },
          normalRange: { type: Type.STRING, description: "The reference range provided." },
          status: { 
            type: Type.STRING, 
            enum: ["normal", "high", "low", "abnormal", "borderline", "unknown"],
            description: "The status based strictly on the reference range." 
          },
          severity: {
            type: Type.STRING,
            enum: ["none", "mild", "moderate", "concerning"],
            description: "Severity of the abnormality. 'none' if normal.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score (0-100) regarding the extraction and interpretation of this specific result.",
          },
          explanation: { type: Type.STRING, description: "Simple explanation. Max 1 sentence for Normal. Max 2 sentences for Abnormal." },
          notes: { type: Type.STRING, description: "Specific data warnings (e.g., 'Unit mismatch'). Empty if none." },
        },
        required: ["test", "value", "normalRange", "status", "explanation", "confidence"],
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
      description: "List of general range mistakes, unit mismatches, or unreadable fields detected in the document.",
    }
  },
  required: ["summary", "results", "abnormalFindings", "suggestedQuestions"],
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
      You are a specialized medical document interpreter. Your goal is to provide plain-language, patient-friendly summaries.
      
      Output Language: ${langName}

      STRICT RULES:
      1. Do NOT give medical diagnosis. Only interpret the data present.
      2. Only compare results using the reference ranges PROVIDED in the document.
      3. If reference range looks wrong, reversed, or impossible, set status to 'unknown' and add a note: " Reference range appears incorrect."
      4. If the units between result and reference range do not match, set status to 'unknown' and add a note: " Unit mismatch detected."
      5. Add a confidence score (0-100) for each interpretation based on image clarity and data consistency.
      6. Categorize each abnormal result severity into: Mild, Moderate, or Concerning. Use 'none' for normal results.
      7. Keep the explanation simple enough for a 12-year-old to understand. Avoid complex jargon.

      IMPORTANT FORMATTING INSTRUCTIONS:
      - Response must be short, structured, and easy to scan visually.
      - **Summary**: Concise, 2-4 sentences max.
      - **Explanations**:
        - For NORMAL results: Max 1 sentence.
        - For ABNORMAL results: Max 2 sentences.
      - **Data Quality**: Group all general warnings (range mistakes, unit mismatches, unreadable text) into the 'errorsDetected' list. Only use the 'notes' field on specific results if critical.

      Analyze the attached medical document image/PDF and return the JSON response.
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
        temperature: 0.1, // Very low temperature for high precision
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
            text: `This is my medical document. I may have follow-up questions. Please answer in ${langName}. Keep answers simple (EL12). Strictly NO diagnosis.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `I have analyzed your document. I am ready to answer your questions in ${langName}. I am an AI, not a doctor, and I cannot provide a diagnosis.`,
          },
        ],
      },
    ],
    config: {
        systemInstruction: "You are a helpful, empathetic medical interpreter. You explain medical concepts simply (for a 12 year old). You strictly refuse to provide diagnoses or treatment plans. You always advise consulting a doctor for medical decisions."
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