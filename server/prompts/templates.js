function buildEnrichmentPrompt(lead) {
  const { name = "", role = "", company = "", industry = "" } = lead || {};

  return `You are a B2B sales intelligence analyst.
Given this lead: Name: ${name}, Role: ${role}, Company: ${company}, Industry: ${industry}
Return ONLY a valid JSON object, no markdown, no explanation, just raw JSON:
{
  "companySize": "one of startup/SMB/mid-market/enterprise",
  "estimatedRevenue": "a realistic revenue range string",
  "painPoints": ["array of 3 specific pain point strings"],
  "buyingIntent": "one of low/medium/high",
  "techStack": ["array of 2-3 likely tools they use"],
  "decisionMakerLikelihood": "one of low/medium/high",
  "bestOutreachChannel": "one of email/linkedin/call",
  "enrichmentScore": "integer between 0 and 100"
}`;
}

function buildSummaryPrompt(lead, enrichment) {
  const payload = {
    lead: lead || {},
    enrichment: enrichment || {}
  };

  return `You are a senior sales strategist.
Lead Profile: ${JSON.stringify(payload)}
Write a prospect intelligence brief in exactly 3 paragraphs:
Paragraph 1: Who they are and their business context
Paragraph 2: Their likely pain points and what they need
Paragraph 3: Recommended approach and messaging angle
Be sharp, specific, and actionable. No generic filler.
Return as plain text, no JSON needed.`;
}

function buildEmailPrompt(lead, enrichment, summary) {
  const {
    name = "",
    role = "",
    company = ""
  } = lead || {};

  const painPoints = Array.isArray(enrichment?.painPoints)
    ? enrichment.painPoints.join(", ")
    : "";

  return `You are an expert B2B cold email copywriter.
Lead: ${name}, Role: ${role}, Company: ${company}
Pain Points: ${painPoints}
Context: ${summary || ""}
Write a cold email using the PAS framework:
(Problem -> Agitate -> Solution)
Rules:
- Subject line: curiosity-driven, under 8 words
- Opening: reference something specific about their role or company, never generic
- Body: maximum 3 short paragraphs
- CTA: one clear low-friction ask
- Tone: conversational, confident, not salesy
Return ONLY raw JSON, no markdown:
{
  "subject": "subject line string",
  "body": "full email body string",
  "cta": "call to action string"
}`;
}

module.exports = {
  buildEnrichmentPrompt,
  buildSummaryPrompt,
  buildEmailPrompt
};
