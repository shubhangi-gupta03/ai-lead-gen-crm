const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const GEMINI_MODEL = "gemini-1.5-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const AI_PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const raw = String(error?.message || "");
  return /quota|rate|429|resource has been exhausted|overloaded|timeout|temporarily/i.test(
    raw
  );
}

function explainProviderError(provider, error) {
  const raw = String(error?.message || "Unknown AI error");
  return `${provider} failed: ${raw}`;
}

async function withRetry(task, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }
      await sleep((attempt + 1) * 1200);
    }
  }
}

async function generateWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await withRetry(() => model.generateContent(prompt));
  return result.response.text();
}

async function generateWithGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const result = await withRetry(() =>
    groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }]
    })
  );

  return result?.choices?.[0]?.message?.content || "";
}

async function generateText(prompt) {
  const providerOrder =
    AI_PROVIDER === "gemini"
      ? ["gemini"]
      : AI_PROVIDER === "llama" || AI_PROVIDER === "groq"
        ? ["groq"]
        : ["groq", "gemini"];

  let lastError = null;
  for (const provider of providerOrder) {
    try {
      const text =
        provider === "groq"
          ? await generateWithGroq(prompt)
          : await generateWithGemini(prompt);
      return {
        text: typeof text === "string" ? text : "",
        provider
      };
    } catch (error) {
      lastError = explainProviderError(provider, error);
      console.error(`[AI_${provider.toUpperCase()}_ERROR]`, error);
    }
  }

  throw new Error(lastError || "All AI providers failed");
}

module.exports = {
  generateText
};
