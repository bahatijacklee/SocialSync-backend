const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable
const API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate text content using Gemini
async function generateContent(prompt) {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  
  try {
    // Use the gemini-2.0-flash model as per the working curl example
    // We will try this model since gemini-pro was not found or supported
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate content from Gemini.");
  }
}

// Function to analyze sentiment of text using Gemini
async function analyzeSentiment(text) {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  try {
    // Use the gemini-2.0-flash model for sentiment analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze the sentiment of the following text and classify it as positive, negative, or neutral. Provide a brief explanation for your classification.\n\nText: ${text}\n\nSentiment:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sentimentResult = response.text();
    return sentimentResult;

  } catch (error) {
    console.error("Error calling Gemini API for sentiment analysis:", error);
    throw new Error("Failed to analyze sentiment from Gemini.");
  }
}

module.exports = {
  generateContent,
  analyzeSentiment,
  // We will not export or rely on listModels for now due to the previous error
  // listModels might not be available or working as expected in this SDK/environment setup
}; 