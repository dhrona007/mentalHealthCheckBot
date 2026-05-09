import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview";

const getGeminiApiKey = () =>
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

let client: GoogleGenAI | null = null;

export const isGeminiConfigured = () => Boolean(getGeminiApiKey());

export const getGeminiClient = () => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.",
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
};

export const formatAiError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Something went wrong with AI.";

  if (/api key|API_KEY|missing/i.test(message)) {
    return "Gemini is not configured. Add VITE_GEMINI_API_KEY to your .env file, then restart the app.";
  }

  if (/quota|rate|429/i.test(message)) {
    return "Gemini is temporarily rate-limited. Please wait a moment and try again.";
  }

  if (/permission|403|unauthorized|401/i.test(message)) {
    return "Gemini rejected the request. Please check that your API key is valid and allowed to use this model.";
  }

  if (/network|fetch|Failed to fetch/i.test(message)) {
    return "Gemini could not be reached. Please check your internet connection and try again.";
  }

  return "AI response failed. Please try again in a moment.";
};

export const generateGeminiText = async (contents: string) => {
  const result = await getGeminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents,
  });

  return result.text?.trim() || "";
};
