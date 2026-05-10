const express = require("express");
const { buildEmailPrompt } = require("../prompts/templates");
const { generateText } = require("../lib/aiClient");

const router = express.Router();

const DELAY_MS = 500;
let queue = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeJSON(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/```$/i, "").trim();
  return cleaned;
}

function buildFallbackEmail(lead, enrichment, summary) {
  const name = lead?.name || "there";
  const role = lead?.role || "your role";
  const company = lead?.company || "your team";
  const painPoints = Array.isArray(enrichment?.painPoints)
    ? enrichment.painPoints.slice(0, 2).join(" and ")
    : "growth and efficiency priorities";

  return {
    subject: `Quick idea for ${company}`,
    body: `Hi ${name},

As ${role} at ${company}, you are likely balancing ambitious targets with limited bandwidth. Teams in similar roles often struggle with ${painPoints}.

When those issues persist, pipeline quality drops and execution becomes reactive. We help teams fix this with a focused workflow that improves lead quality and outreach consistency without adding process overhead.

If useful, I can share a short walkthrough tailored to your priorities: ${summary ? "based on your current context." : "in a 15-minute call."}`,
    cta: "Open to a 15-minute intro next week?"
  };
}

function parseEmailJSON(text, lead, enrichment, summary) {
  try {
    const cleaned = normalizeJSON(text);
    const parsed = JSON.parse(cleaned);

    return {
      subject: parsed.subject || `Quick idea for ${lead?.company || "your team"}`,
      body: parsed.body || buildFallbackEmail(lead, enrichment, summary).body,
      cta: parsed.cta || "Would you be open to a quick call next week?"
    };
  } catch (error) {
    console.error("[EMAIL_PARSE_ERROR]", error);
    return buildFallbackEmail(lead, enrichment, summary);
  }
}

async function runEmailTask(lead, enrichment, summary) {
  const prompt = buildEmailPrompt(lead, enrichment, summary);
  const { text } = await generateText(prompt);
  return parseEmailJSON(text, lead, enrichment, summary);
}

router.post("/", async (req, res) => {
  const { lead, enrichment, summary } = req.body || {};

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return res.status(200).json({
      success: false,
      email: buildFallbackEmail(lead, enrichment, summary),
      error:
        "No AI provider key found. Add GEMINI_API_KEY or GROQ_API_KEY to server/.env and restart backend."
    });
  }

  if (!lead || !enrichment || !summary) {
    return res.status(400).json({
      error: "Missing required fields: lead, enrichment, summary"
    });
  }

  try {
    const task = queue.then(async () => {
      const email = await runEmailTask(lead, enrichment, summary);
      await sleep(DELAY_MS);
      return email;
    });

    queue = task.catch(() => {});
    const email = await task;

    return res.status(200).json({
      success: true,
      email
    });
  } catch (error) {
    console.error("[EMAIL_ROUTE_ERROR]", error);
    return res.status(200).json({
      success: false,
      email: buildFallbackEmail(lead, enrichment, summary),
      error: String(error?.message || "AI email generation temporarily unavailable. Please retry.")
    });
  }
});

module.exports = router;
