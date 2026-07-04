import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // There is no listModels method directly on GoogleGenerativeAI instance in older SDK versions, 
    // but we can query it via a fetch request or by calling the API.
    // Let's do a direct fetch to list the models to see what is supported.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch models: ${response.status} - ${text}`);
      return;
    }
    const data = await response.json();
    console.log("Available models:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

main();
