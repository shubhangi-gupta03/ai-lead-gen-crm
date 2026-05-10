const express = require("express");
const { buildEnrichmentPrompt } = require("../prompts/templates");
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

function parseEnrichmentJSON(text) {
  try {
    const cleaned = normalizeJSON(text);
    const parsed = JSON.parse(cleaned);

    return {
      companySize: parsed.companySize || "SMB",
      estimatedRevenue: parsed.estimatedRevenue || "Unknown",
      painPoints: Array.isArray(parsed.painPoints)
        ? parsed.painPoints.slice(0, 3)
        : [],
      buyingIntent: parsed.buyingIntent || "medium",
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack.slice(0, 3) : [],
      decisionMakerLikelihood: parsed.decisionMakerLikelihood || "medium",
      bestOutreachChannel: parsed.bestOutreachChannel || "email",
      enrichmentScore:
        typeof parsed.enrichmentScore === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.enrichmentScore)))
          : 50
    };
  } catch (error) {
    console.error("[ENRICH_PARSE_ERROR]", error);
    return {
      companySize: "SMB",
      estimatedRevenue: "Unknown",
      painPoints: [
        "Cost optimization pressure",
        "Operational inefficiency",
        "Need for scalable growth"
      ],
      buyingIntent: "medium",
      techStack: ["CRM", "Analytics", "Email Automation"],
      decisionMakerLikelihood: "medium",
      bestOutreachChannel: "email",
      enrichmentScore: 45
    };
  }
}

async function runEnrichmentTask(lead) {
  const prompt = buildEnrichmentPrompt(lead);
  const { text } = await generateText(prompt);
  return parseEnrichmentJSON(text);
}

router.post("/", async (req, res) => {
  const { name, role, company, industry } = req.body || {};

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return res.status(200).json({
      success: false,
      enrichment: {
        companySize: "SMB",
        estimatedRevenue: "Unknown",
        painPoints: [
          "Process bottlenecks",
          "Lead conversion inconsistency",
          "Limited automation maturity"
        ],
        buyingIntent: "medium",
        techStack: ["CRM", "Spreadsheets", "Email"],
        decisionMakerLikelihood: "low",
        bestOutreachChannel: "email",
        enrichmentScore: 30
      },
      error:
        "No AI provider key found. Add GEMINI_API_KEY or GROQ_API_KEY to server/.env and restart backend."
    });
  }

  if (!name || !role || !company || !industry) {
    return res.status(400).json({
      error: "Missing required fields: name, role, company, industry"
    });
  }

  try {
    const task = queue.then(async () => {
      const enrichment = await runEnrichmentTask({ name, role, company, industry });
      await sleep(DELAY_MS);
      return enrichment;
    });

    queue = task.catch(() => {});
    const enrichment = await task;

    return res.status(200).json({
      success: true,
      enrichment
    });
  } catch (error) {
    console.error("[ENRICH_ROUTE_ERROR]", error);
    return res.status(200).json({
      success: false,
      enrichment: {
        companySize: "SMB",
        estimatedRevenue: "Unknown",
        painPoints: [
          "Process bottlenecks",
          "Lead conversion inconsistency",
          "Limited automation maturity"
        ],
        buyingIntent: "medium",
        techStack: ["CRM", "Spreadsheets", "Email"],
        decisionMakerLikelihood: "low",
        bestOutreachChannel: "email",
        enrichmentScore: 30
      },
      error: String(error?.message || "AI enrichment temporarily unavailable. Please retry.")
    });
  }
});

module.exports = router;
