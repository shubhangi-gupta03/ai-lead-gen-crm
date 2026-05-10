import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { useLeadStore } from "../store/leadStore";

const matchSearch = (lead, search) => {
  if (!search) return true;
  const q = search.toLowerCase();
  return [lead.name, lead.company, lead.role].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(q)
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

export default function Navbar() {
  const search = useLeadStore((s) => s.search);
  const filters = useLeadStore((s) => s.filters);
  const allLeads = useLeadStore((s) => s.leads);
  const setSearch = useLeadStore((s) => s.setSearch);
  const setFilter = useLeadStore((s) => s.setFilter);
  const clearFilter = useLeadStore((s) => s.clearFilter);
  const clearAllFilters = useLeadStore((s) => s.clearAllFilters);

  const leads = useMemo(
    () => allLeads.filter((lead) => matchSearch(lead, search) && matchFilter(lead, filters)),
    [allLeads, search, filters]
  );

  const uniqueIndustries = [...new Set(allLeads.map((lead) => lead.industry).filter(Boolean))];

  const chips = Object.entries(filters).filter(([, value]) => value);

  return (
    <header className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Lead Generation CRM</h1>
          <p className="text-sm text-slate-400">{leads.length} leads in current view</p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, role..."
            className="w-full rounded-md border border-slate-600 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={filters.industry}
          onChange={(e) => setFilter("industry", e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
        >
          <option value="">All Industries</option>
          {uniqueIndustries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>

        <select
          value={filters.stage}
          onChange={(e) => setFilter("stage", e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
        >
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.buyingIntent}
          onChange={(e) => setFilter("buyingIntent", e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
        >
          <option value="">All Buying Intent</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={filters.companySize}
          onChange={(e) => setFilter("companySize", e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/60"
        >
          <option value="">All Company Sizes</option>
          <option value="startup">Startup</option>
          <option value="SMB">SMB</option>
          <option value="mid-market">Mid-Market</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {!!chips.length && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map(([key, value]) => (
            <button
              key={key}
              onClick={() => clearFilter(key)}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-500/20"
            >
              {key}: {value}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-300 underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </header>
  );
}
