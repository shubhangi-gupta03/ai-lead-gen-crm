import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

export default function SummaryPanel({
  open,
  lead,
  onClose,
  onRegenerate,
  isLoading
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Prospect Intelligence</h3>
                <p className="text-xs text-slate-400">
                  {lead?.name} - {lead?.company}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4">
              {lead?.isSummarizing ? (
                <div className="space-y-3">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-700" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-700" />
                  <div className="h-3 w-11/12 animate-pulse rounded bg-slate-700" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-slate-700" />
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {lead?.summary || "No summary available yet."}
                </div>
              )}
            </div>

            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
