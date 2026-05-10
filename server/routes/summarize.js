const express = require("express");
const { buildSummaryPrompt } = require("../prompts/templates");
const { generateText } = require("../lib/aiClient");

const router = express.Router();

const DELAY_MS = 500;
let queue = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFallbackSummary(lead, enrichment) {
  const name = lead?.name || "This lead";
  const role = lead?.role || "decision stakeholder";
  const company = lead?.company || "the organization";
  const industry = lead?.industry || "their sector";
  const painPoints = Array.isArray(enrichment?.painPoints)
    ? enrichment.painPoints.slice(0, 2).join(" and ")
    : "efficiency and growth challenges";

  return `${name} works as ${role} at ${company}, operating in ${industry}. They are likely responsible for balancing day-to-day execution with strategic outcomes and will care about solutions that are easy to adopt across teams.

Key challenges likely include ${painPoints}. Based on the profile, they may be evaluating options that reduce manual effort, improve visibility into results, and support more predictable performance across core workflows.

A strong outreach angle is to lead with one specific business pain, tie it to a measurable impact, and suggest a low-friction next step. Keep messaging concise, role-relevant, and focused on practical outcomes rather than feature-heavy claims.`;
}

async function runSummaryTask(lead, enrichment) {
  const prompt = buildSummaryPrompt(lead, enrichment);
  const { text } = await generateText(prompt);
  return typeof text === "string" && text.trim()
    ? text.trim()
    : buildFallbackSummary(lead, enrichment);
}

router.post("/", async (req, res) => {
  const { lead, enrichment } = req.body || {};

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return res.status(200).json({
      success: false,
      summary: buildFallbackSummary(lead, enrichment),
      error:
        "No AI provider key found. Add GEMINI_API_KEY or GROQ_API_KEY to server/.env and restart backend."
    });
  }

  if (!lead || !enrichment) {
    return res.status(400).json({
      error: "Missing required fields: lead, enrichment"
    });
  }

  try {
    const task = queue.then(async () => {
      const summary = await runSummaryTask(lead, enrichment);
      await sleep(DELAY_MS);
      return summary;
    });

    queue = task.catch(() => {});
    const summary = await task;

    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error("[SUMMARIZE_ROUTE_ERROR]", error);
    return res.status(200).json({
      success: false,
      summary: buildFallbackSummary(lead, enrichment),
      error: String(error?.message || "AI summary temporarily unavailable. Please retry.")
    });
  }
});

module.exports = router;
