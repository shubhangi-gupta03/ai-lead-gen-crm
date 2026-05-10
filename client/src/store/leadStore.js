import { create } from "zustand";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const STAGES = ["new", "contacted", "qualified", "closed"];

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeLead = (lead) => ({
  id: lead.id || makeId(),
  name: (lead.name || "").trim(),
  role: (lead.role || "").trim(),
  company: (lead.company || "").trim(),
  industry: (lead.industry || "").trim(),
  email: (lead.email || "").trim(),
  phone: (lead.phone || "").trim(),
  linkedin: (lead.linkedin || "").trim(),
  stage: STAGES.includes(lead.stage) ? lead.stage : "new",
  enrichment: lead.enrichment || null,
  summary: lead.summary || "",
  emailDraft: lead.emailDraft || null,
  isEnriching: false,
  isSummarizing: false,
  isGeneratingEmail: false,
  errors: {
    enrich: null,
    summary: null,
    email: null
  }
});

const matchSearch = (lead, search) => {
  if (!search) return true;
  const q = search.toLowerCase();
  return [lead.name, lead.company, lead.role].some((v) =>
    (v || "").toLowerCase().includes(q)
  );
};

const matchFilter = (lead, filters) => {
  const { industry, stage, buyingIntent, companySize } = filters;
  const leadIntent = lead.enrichment?.buyingIntent || "";
  const leadCompanySize = lead.enrichment?.companySize || "";

  return (
    (!industry || lead.industry === industry) &&
    (!stage || lead.stage === stage) &&
    (!buyingIntent || leadIntent === buyingIntent) &&
    (!companySize || leadCompanySize === companySize)
  );
};

export const useLeadStore = create((set, get) => ({
  leads: [],
  search: "",
  filters: {
    industry: "",
    stage: "",
    buyingIntent: "",
    companySize: ""
  },
  ui: {
    selectedLeadId: null,
    summaryOpen: false,
    emailOpen: false
  },

  addLead: (lead) => {
    if (!lead?.name || !lead?.role || !lead?.company) {
      toast.error("Name, role, and company are required.");
      return;
    }
    set((state) => ({ leads: [normalizeLead(lead), ...state.leads] }));
    toast.success("Lead added.");
  },

  addLeadsBulk: (inputLeads = []) => {
    const valid = inputLeads
      .filter((lead) => lead?.name && lead?.role && lead?.company)
      .map((lead) => normalizeLead(lead));

    if (!valid.length) {
      toast.error("No valid leads found.");
      return;
    }

    set((state) => ({
      leads: [...valid, ...state.leads]
    }));

    toast.success(`${valid.length} lead(s) imported.`);
  },

  removeLead: (leadId) => {
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== leadId)
    }));
    toast.success("Lead deleted.");
  },

  moveLead: (leadId, stage) => {
    if (!STAGES.includes(stage)) return;
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId ? { ...lead, stage } : lead
      )
    }));
  },

  setSearch: (search) => set({ search }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilter: (key) =>
    set((state) => ({ filters: { ...state.filters, [key]: "" } })),
  clearAllFilters: () =>
    set({
      filters: {
        industry: "",
        stage: "",
        buyingIntent: "",
        companySize: ""
      }
    }),

  openSummary: (leadId) =>
    set({
      ui: { selectedLeadId: leadId, summaryOpen: true, emailOpen: false }
    }),
  closeSummary: () =>
    set((state) => ({
      ui: { ...state.ui, summaryOpen: false }
    })),
  openEmail: (leadId) =>
    set({
      ui: { selectedLeadId: leadId, summaryOpen: false, emailOpen: true }
    }),
  closeEmail: () =>
    set((state) => ({
      ui: { ...state.ui, emailOpen: false }
    })),

  updateEmailDraft: (leadId, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              emailDraft: {
                ...(lead.emailDraft || {}),
                ...updates
              }
            }
          : lead
      )
    })),

  enrichLead: async (leadId) => {
    const lead = get().leads.find((item) => item.id === leadId);
    if (!lead) return;

    set((state) => ({
      leads: state.leads.map((item) =>
        item.id === leadId
          ? {
              ...item,
              isEnriching: true,
              errors: { ...item.errors, enrich: null }
            }
          : item
      )
    }));

    try {
      const res = await fetch(`${API_BASE}/api/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          role: lead.role,
          company: lead.company,
          industry: lead.industry
        })
      });
      const data = await res.json();

      const enrichment = data?.enrichment || null;
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                enrichment,
                isEnriching: false,
                errors: { ...item.errors, enrich: data?.success ? null : data?.error }
              }
            : item
        )
      }));

      if (data?.success) {
        toast.success(`Lead enriched: ${lead.name}`);
      } else {
        toast.error(data?.error || "Enrichment failed. Try again.");
      }
    } catch (error) {
      console.error("[CLIENT_ENRICH_ERROR]", error);
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                isEnriching: false,
                errors: { ...item.errors, enrich: "Network error. Retry enrichment." }
              }
            : item
        )
      }));
      toast.error("Network error during enrichment.");
    }
  },

  summarizeLead: async (leadId) => {
    const lead = get().leads.find((item) => item.id === leadId);
    if (!lead?.enrichment) {
      toast.error("Enrich this lead first.");
      return;
    }

    set((state) => ({
      leads: state.leads.map((item) =>
        item.id === leadId
          ? {
              ...item,
              isSummarizing: true,
              errors: { ...item.errors, summary: null }
            }
          : item
      )
    }));

    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            name: lead.name,
            role: lead.role,
            company: lead.company,
            industry: lead.industry,
            email: lead.email,
            phone: lead.phone,
            linkedin: lead.linkedin
          },
          enrichment: lead.enrichment
        })
      });
      const data = await res.json();

      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                summary: data?.summary || item.summary,
                isSummarizing: false,
                errors: { ...item.errors, summary: data?.success ? null : data?.error }
              }
            : item
        )
      }));

      get().openSummary(leadId);
      if (data?.success) {
        toast.success(`Summary generated for ${lead.name}`);
      } else {
        toast.error(data?.error || "Summary generated with fallback.");
      }
    } catch (error) {
      console.error("[CLIENT_SUMMARY_ERROR]", error);
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                isSummarizing: false,
                errors: { ...item.errors, summary: "Network error. Retry summary." }
              }
            : item
        )
      }));
      toast.error("Network error during summary generation.");
    }
  },

  generateEmail: async (leadId) => {
    const lead = get().leads.find((item) => item.id === leadId);
    if (!lead?.enrichment || !lead?.summary) {
      toast.error("Generate enrichment and summary first.");
      return;
    }

    set((state) => ({
      leads: state.leads.map((item) =>
        item.id === leadId
          ? {
              ...item,
              isGeneratingEmail: true,
              errors: { ...item.errors, email: null }
            }
          : item
      )
    }));

    try {
      const res = await fetch(`${API_BASE}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            name: lead.name,
            role: lead.role,
            company: lead.company,
            industry: lead.industry
          },
          enrichment: lead.enrichment,
          summary: lead.summary
        })
      });
      const data = await res.json();

      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                emailDraft: data?.email || item.emailDraft,
                isGeneratingEmail: false,
                errors: { ...item.errors, email: data?.success ? null : data?.error }
              }
            : item
        )
      }));

      get().openEmail(leadId);
      if (data?.success) {
        toast.success(`Email generated for ${lead.name}`);
      } else {
        toast.error(data?.error || "Email generated with fallback.");
      }
    } catch (error) {
      console.error("[CLIENT_EMAIL_ERROR]", error);
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                isGeneratingEmail: false,
                errors: { ...item.errors, email: "Network error. Retry email generation." }
              }
            : item
        )
      }));
      toast.error("Network error during email generation.");
    }
  },

  getLeadById: (leadId) => get().leads.find((lead) => lead.id === leadId) || null,

  getVisibleLeads: () => {
    const { leads, search, filters } = get();
    return leads.filter((lead) => matchSearch(lead, search) && matchFilter(lead, filters));
  },

  getLeadsByStage: (stage) => get().getVisibleLeads().filter((lead) => lead.stage === stage),

  getStats: () => {
    const { leads } = get();
    const total = leads.length;
    const enriched = leads.filter((lead) => !!lead.enrichment).length;
    const emailsGenerated = leads.filter((lead) => !!lead.emailDraft).length;
    const converted = leads.filter(
      (lead) => lead.stage === "qualified" || lead.stage === "closed"
    ).length;
    const conversionPct = total ? Math.round((converted / total) * 100) : 0;

    return {
      total,
      enriched,
      emailsGenerated,
      conversionPct
    };
  }
}));
