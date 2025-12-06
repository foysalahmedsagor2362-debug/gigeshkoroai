import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SummaryResult } from "../types";

// Initialize the Gemini API client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We use a fallback to allow the app to load even if the key is missing, 
// then validate it inside the functions to provide user feedback.
const apiKey = process.env.API_KEY || "";
// Provide a dummy key if missing to prevent the SDK from throwing a "Key must not be empty" error during app initialization.
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key_to_load_app" });

const MODEL_NAME = 'gemini-2.5-flash';

// --- Chat Service ---

export const createChatSession = (language: string = 'English'): Chat => {
  if (!apiKey || apiKey === "dummy_key_to_load_app") {
    throw new Error("API_KEY_MISSING");
  }

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `You are "Gigesh Koro AI", a specialized Academic Tutor.
      
      CURRENT LANGUAGE SETTING: ${language}
      You MUST allow user to ask questions in any language, but you should primarily respond in ${language} unless the user explicitly asks otherwise.

      YOUR SCOPE:
      - Physics
      - Chemistry
      - Biology
      - Mathematics

      RULES:
      1. Name yourself as "Gigesh Koro AI" if asked.
      2. If a user asks a question related to Science or Math, answer clearly, accurately, and step-by-step. Use LaTeX for math.
      3. If a user uploads a PDF or image, analyze it within the context of STEM.
      4. If a user asks about anything else (History, Literature, Coding, Politics, General Chat, etc.), politely decline.
      5. Tone: Helpful, Encouraging, Academic.`,
    },
  });
};

// --- Helper to convert file to base64 for Gemini ---
export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// --- Summary Service ---

export const generateSmartSummary = async (text: string): Promise<SummaryResult> => {
  if (!apiKey || apiKey === "dummy_key_to_load_app") {
    throw new Error("API_KEY_MISSING");
  }

  const prompt = `Analyze the following study material and provide a structured summary. 
  Ensure the summary is strictly academic and related to Physics, Chemistry, Biology, or Math context if possible.
  
  Material:
  """
  ${text.substring(0, 30000)} 
  """
  `;

  // Define the schema for the structured output
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A concise summary of the content (approx 100-150 words).",
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 key bullet points extracting the most important information.",
          },
          terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
              },
              required: ["term", "definition"],
            },
            description: "Important terms and their brief definitions found in the text.",
          },
          practiceQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 practice questions based on the material to test understanding.",
          },
        },
        required: ["summary", "keyPoints", "terms", "practiceQuestions"],
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as SummaryResult;
  }
  
  throw new Error("Failed to generate summary structure.");
};