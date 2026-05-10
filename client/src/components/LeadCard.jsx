import { motion } from "framer-motion";
import { Loader2, RotateCcw, Trash2, Zap, Brain, Mail } from "lucide-react";
import EnrichmentBadge from "./EnrichmentBadge";

function scoreColor(score) {
  if (score <= 40) return "bg-red-500";
  if (score <= 70) return "bg-yellow-500";
  return "bg-green-500";
}

export default function LeadCard({
  lead,
  onEnrich,
  onSummary,
  onEmail,
  onDelete
}) {
  const enrichmentScore = lead.enrichment?.enrichmentScore ?? 0;
  const hasEnrichment = !!lead.enrichment;
  const hasSummary = !!lead.summary;
  const hasEmail = !!lead.emailDraft;

  const enrichBusy = lead.isEnriching;
  const summaryBusy = lead.isSummarizing;
  const emailBusy = lead.isGeneratingEmail;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">{lead.name}</h4>
          <p className="text-xs text-slate-300">{lead.role}</p>
          <p className="text-xs text-slate-400">{lead.company}</p>
        </div>
        <EnrichmentBadge enriched={hasEnrichment} />
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Enrichment Score</span>
          <span>{enrichmentScore}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full ${scoreColor(enrichmentScore)} transition-all`}
            style={{ width: `${Math.max(0, Math.min(100, enrichmentScore))}%` }}
          />
        </div>
      </div>

      {(lead.errors?.enrich || lead.errors?.summary || lead.errors?.email) && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-200">
          {lead.errors?.enrich && <p>Enrichment: {lead.errors.enrich}</p>}
          {lead.errors?.summary && <p>Summary: {lead.errors.summary}</p>}
          {lead.errors?.email && <p>Email: {lead.errors.email}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEnrich}
          disabled={enrichBusy}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-indigo-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enrichBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {enrichBusy ? "AI Processing..." : lead.errors?.enrich ? "Retry Enrich" : "Enrich"}
        </button>

        <button
          onClick={onSummary}
          disabled={!hasEnrichment || summaryBusy}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-700 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {summaryBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : lead.errors?.summary ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Brain className="h-3.5 w-3.5" />
          )}
          {summaryBusy ? "Generating..." : hasSummary ? "Summary" : "Generate"}
        </button>

        <button
          onClick={onEmail}
          disabled={!hasSummary || emailBusy}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-700 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {emailBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : lead.errors?.email ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {emailBusy ? "Writing..." : hasEmail ? "Email" : "Create"}
        </button>

        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}
