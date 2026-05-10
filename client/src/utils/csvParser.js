import Papa from "papaparse";

const normalizeRow = (row = {}) => ({
  name: (row.name || row.Name || "").trim(),
  role: (row.role || row.Role || "").trim(),
  company: (row.company || row.Company || "").trim(),
  industry: (row.industry || row.Industry || "").trim(),
  email: (row.email || row.Email || "").trim(),
  phone: (row.phone || row.Phone || "").trim(),
  linkedin: (row.linkedin || row.LinkedIn || row.linkedin_url || "").trim()
});

const isValidLead = (lead) => !!lead.name && !!lead.role && !!lead.company;

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const leads = (results.data || [])
            .map(normalizeRow)
            .filter(isValidLead);
          resolve(leads);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export async function parseSampleCsv() {
  const response = await fetch("/sample_leads.csv");
  if (!response.ok) {
    throw new Error("Failed to load sample CSV.");
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const leads = (results.data || [])
            .map(normalizeRow)
            .filter(isValidLead);
          resolve(leads);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}
