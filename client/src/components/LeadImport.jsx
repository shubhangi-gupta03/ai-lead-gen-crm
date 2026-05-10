import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, Plus, FileSpreadsheet } from "lucide-react";
import { useLeadStore } from "../store/leadStore";
import { parseCsvFile, parseSampleCsv } from "../utils/csvParser";

const initialForm = {
  name: "",
  role: "",
  company: "",
  industry: "",
  email: "",
  phone: "",
  linkedin: ""
};

export default function LeadImport() {
  const fileInputRef = useRef(null);
  const addLead = useLeadStore((state) => state.addLead);
  const addLeadsBulk = useLeadStore((state) => state.addLeadsBulk);

  const [form, setForm] = useState(initialForm);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateManualLead = () => {
    if (!form.name || !form.role || !form.company) {
      toast.error("Name, role, and company are required.");
      return false;
    }
    return true;
  };

  const handleManualAdd = (event) => {
    event.preventDefault();
    if (!validateManualLead()) return;

    addLead(form);
    setForm(initialForm);
  };

  const handleFile = async (file) => {
    if (!file) return;

    try {
      const leads = await parseCsvFile(file);
      addLeadsBulk(leads);
    } catch (error) {
      console.error("[CSV_IMPORT_ERROR]", error);
      toast.error("Failed to parse CSV file.");
    }
  };

  const handleFileInput = async (event) => {
    const file = event.target.files?.[0];
    await handleFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    await handleFile(file);
  };

  const loadSampleData = async () => {
    setIsLoadingSample(true);
    try {
      const sampleLeads = await parseSampleCsv();
      addLeadsBulk(sampleLeads);
    } catch (error) {
      console.error("[SAMPLE_CSV_ERROR]", error);
      toast.error("Could not load sample leads.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Import Leads</h2>
          <button
            type="button"
            onClick={loadSampleData}
            disabled={isLoadingSample}
            className="inline-flex items-center gap-2 rounded-md border border-indigo-400/30 bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {isLoadingSample ? "Loading..." : "Load Sample Data"}
          </button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition ${
            isDragActive
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-slate-600 bg-slate-900/60 hover:border-indigo-400/60"
          }`}
        >
          <Upload className="mx-auto mb-2 h-6 w-6 text-indigo-300" />
          <p className="text-sm text-slate-200">Drag and drop CSV here</p>
          <p className="mt-1 text-xs text-slate-400">or click to choose a file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      <form
        onSubmit={handleManualAdd}
        className="rounded-xl border border-slate-700 bg-slate-800/80 p-4"
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-100">Add Lead Manually</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["name", "Name*"],
            ["role", "Role*"],
            ["company", "Company*"],
            ["industry", "Industry"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["linkedin", "LinkedIn URL"]
          ].map(([key, label]) => (
            <input
              key={key}
              value={form[key]}
              onChange={(event) => onFormChange(key, event.target.value)}
              placeholder={label}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/50 placeholder:text-slate-500 focus:ring-2"
            />
          ))}
        </div>
        <button
          type="submit"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </form>
    </section>
  );
}
