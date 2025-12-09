import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisData, Language } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the structured analysis output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief, empathetic summary of the medical document in simple language.",
    },
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          test: { type: Type.STRING, description: "The name of the test or measurement in plain language." },
          value: { type: Type.STRING, description: "The value found in the document." },
          normalRange: { type: Type.STRING, description: "The reference range provided (or standard range if not)." },
          status: { 
            type: Type.STRING, 
            enum: ["normal", "high", "low", "abnormal", "borderline"],
            description: "The clinical status of the result." 
          },
          explanation: { type: Type.STRING, description: "A simple explanation of what this test measures and why the result matters." },
        },
        required: ["test", "value", "normalRange", "status", "explanation"],
      },
    },
    abnormalFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of bullet points highlighting only the abnormal or concerning findings.",
    },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 questions the patient should ask their doctor based on these specific results.",
    },
  },
  required: ["summary", "results", "abnormalFindings", "suggestedQuestions"],
};

export const analyzeDocument = async (
  base64Data: string,
  mimeType: string,
  language: Language
): Promise<AnalysisData> => {
  try {
    const langName = language === 'vi' ? 'Vietnamese' : 'English';
    const prompt = `
      You are an expert medical interpreter helping a patient understand their results.
      Analyze this medical document image/PDF.
      
      Output Language: ${langName}
      
      Tasks:
      1. Extract all test results.
      2. Translate medical jargon into plain ${langName}.
      3. Identify abnormal values.
      4. Provide a comforting and clear summary.
      
      Important: Ensure medical accuracy but prioritize simplicity for a layperson.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using Pro for better reasoning capabilities
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
        temperature: 0.2, // Lower temperature for more factual responses
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

export const initializeChat = (base64Data: string, mimeType: string, language: Language) => {
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
            text: `This is my medical document. I may have follow-up questions. Please answer in ${langName}. Keep answers simple, short, and easy to understand.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `I have analyzed your document. I am ready to answer your questions in ${langName}. Remember, I am an AI, not a doctor.`,
          },
        ],
      },
    ],
    config: {
        systemInstruction: "You are a helpful, empathetic medical assistant. You explain medical concepts simply. You strictly refuse to provide diagnoses or treatment plans. You always advise consulting a doctor for medical decisions."
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
      // Remove the Data-URL declaration (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
