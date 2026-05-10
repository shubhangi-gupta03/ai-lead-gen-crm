import { CheckCircle2, Sparkles } from "lucide-react";

export default function EnrichmentBadge({ enriched }) {
  if (enriched) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-200">
        <CheckCircle2 className="h-3 w-3" />
        AI Enriched
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-700/60 px-2 py-1 text-[10px] font-medium text-slate-300">
      <Sparkles className="h-3 w-3" />
      Not Enriched
    </span>
  );
}
