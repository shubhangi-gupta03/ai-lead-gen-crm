import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";

export default function EmailModal({
  open,
  lead,
  onClose,
  onRegenerate,
  onSave,
  isLoading
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");

  useEffect(() => {
    if (!lead?.emailDraft) return;
    setSubject(lead.emailDraft.subject || "");
    setBody(lead.emailDraft.body || "");
    setCta(lead.emailDraft.cta || "");
  }, [lead?.emailDraft, open]);

  const copyToClipboard = async () => {
    const full = `Subject: ${subject}\n\n${body}\n\n${cta}`;
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Email copied to clipboard.");
    } catch (error) {
      toast.error("Failed to copy email.");
    }
  };

  const handleSave = () => {
    onSave({ subject, body, cta });
    toast.success("Email draft updated.");
  };

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
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Cold Email Generator</h3>
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

            <div className="space-y-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={9}
                placeholder="Email body"
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="CTA"
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </button>
              <button
                onClick={handleSave}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                Save Edits
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
