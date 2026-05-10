import { useMemo } from "react";
import { BarChart3, Mail, Target, Users } from "lucide-react";
import { useLeadStore } from "../store/leadStore";
import LeadImport from "./LeadImport";
import Navbar from "./Navbar";
import Pipeline from "./Pipeline";
import SummaryPanel from "./SummaryPanel";
import EmailModal from "./EmailModal";

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <div className="mb-2 inline-flex rounded-md bg-indigo-500/20 p-2 text-indigo-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

export default function Dashboard() {
  const leads = useLeadStore((s) => s.leads);
  const ui = useLeadStore((s) => s.ui);
  const closeSummary = useLeadStore((s) => s.closeSummary);
  const closeEmail = useLeadStore((s) => s.closeEmail);
  const summarizeLead = useLeadStore((s) => s.summarizeLead);
  const generateEmail = useLeadStore((s) => s.generateEmail);
  const updateEmailDraft = useLeadStore((s) => s.updateEmailDraft);

  const selectedLead = useMemo(() => {
    if (!ui.selectedLeadId) return null;
    return leads.find((lead) => lead.id === ui.selectedLeadId) || null;
  }, [ui.selectedLeadId, leads]);

  const stats = useMemo(() => {
    const total = leads.length;
    const enriched = leads.filter((lead) => !!lead.enrichment).length;
    const emailsGenerated = leads.filter((lead) => !!lead.emailDraft).length;
    const converted = leads.filter(
      (lead) => lead.stage === "qualified" || lead.stage === "closed"
    ).length;
    const conversionPct = total ? Math.round((converted / total) * 100) : 0;
    return { total, enriched, emailsGenerated, conversionPct };
  }, [leads]);

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-5">
      <Navbar />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Leads" value={stats.total} />
        <StatCard icon={BarChart3} label="Enriched Leads" value={stats.enriched} />
        <StatCard icon={Mail} label="Emails Generated" value={stats.emailsGenerated} />
        <StatCard icon={Target} label="Conversion %" value={`${stats.conversionPct}%`} />
      </section>

      <LeadImport />
      <Pipeline />

      <SummaryPanel
        open={ui.summaryOpen}
        lead={selectedLead}
        isLoading={!!selectedLead?.isSummarizing}
        onClose={closeSummary}
        onRegenerate={() => selectedLead && summarizeLead(selectedLead.id)}
      />

      <EmailModal
        open={ui.emailOpen}
        lead={selectedLead}
        isLoading={!!selectedLead?.isGeneratingEmail}
        onClose={closeEmail}
        onRegenerate={() => selectedLead && generateEmail(selectedLead.id)}
        onSave={(draft) => selectedLead && updateEmailDraft(selectedLead.id, draft)}
      />
    </main>
  );
}
