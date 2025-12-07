import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SummaryResult } from "../types";

// --- API Key Management ---

// Helper to robustly find the API Key from various Vite/Environment sources
const getApiKey = (): string => {
  // 1. Check standard Vite environment variable (Recommended for Vercel)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  // 2. Check process.env (Injected via vite.config.ts define)
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
// Initialize with the key if present, or a dummy string to prevent immediate crash on load.
// We guard actual calls with checks later.
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
      systemInstruction: `You are "JIGESHAI", an advanced AI Tutor dedicated to helping students master Science and Mathematics.

      CURRENT LANGUAGE SETTING: ${language}
      You MUST allow the user to ask questions in any language, but you should primarily respond in ${language} unless the user explicitly asks otherwise.

      YOUR DOMAIN EXPERTISE:
      - Physics (Mechanics, Thermodynamics, Electromagnetism, Quantum, etc.)
      - Chemistry (Organic, Inorganic, Physical)
      - Biology (Genetics, Cell Biology, Anatomy, Ecology)
      - Mathematics (Algebra, Calculus, Geometry, Statistics)

      TEACHING GUIDELINES:
      1. **Clear Explanations**: Break down complex topics into simple, digestible parts.
      2. **Step-by-Step Solving**: For math and physics problems, show the formula used, the substitution, and the final calculation step-by-step.
      3. **Use Analogies**: Use real-world examples to explain abstract concepts.
      4. **Encouragement**: Be supportive and encouraging. If a student is stuck, guide them rather than just giving the answer immediately if appropriate.
      5. **Formatting**: 
         - Use **Bold** for key terms.
         - Use Bullet points for lists.
         - **CRITICAL**: Use LaTeX for ALL mathematical expressions.
         - Use single dollar signs for inline math: $E = mc^2$
         - Use double dollar signs for block equations: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
         - Do NOT use \\( ... \\) or \\[ ... \\]. Always use $ or $$.

      STRICT RULES:
      1. Identity: Name yourself as "JIGESHAI" if asked.
      2. Scope: Strict adherence to STEM subjects. If a user asks about History, Literature, Coding (unless related to Math/Science computation), Politics, or Entertainment, politely decline and steer the conversation back to Science or Math.
      3. Image Analysis: If an image is uploaded, analyze it in the context of a student asking for help. Extract the problem and solve it.
      4. Safety: Do not help with questions that involve dangerous chemical synthesis, making weapons, or anything harmful.`,
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