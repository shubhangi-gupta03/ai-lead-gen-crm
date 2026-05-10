# AI Lead Generation CRM

Production-grade AI-powered Lead Generation CRM built with React + Vite (frontend) and Node.js + Express (backend), with Google Gemini-driven lead enrichment, prospect summarization, and personalized cold email generation.

## Core Features

- Import leads via CSV (drag-and-drop) or manual form entry
- AI enrichment engine with structured JSON output and fallback safety
- Prospect intelligence summary generation (3-paragraph brief)
- Cold email generator using PAS framework with editable modal
- Kanban CRM pipeline with drag-and-drop stages
- Search, multi-filtering, and active filter chips
- Analytics header (total, enriched, emails, conversion)
- Per-lead loading, retry states, and robust non-crashing error handling

## Architecture

```text
CSV/Manual Input
     ↓
Lead Import Module
     ↓
┌─────────────────────────┐
│ LLM Chain               │
│ Step 1: Enrichment      │
│ Step 2: Summarization   │
│ Step 3: Email Gen       │
└─────────────────────────┘
     ↓
Kanban CRM Dashboard
```

## Tech Stack

- Frontend: React + Vite
- Styling: Tailwind CSS + shadcn/ui-compatible dependency stack
- State: Zustand
- Drag & Drop: `@hello-pangea/dnd`
- CSV Parsing: PapaParse
- Notifications: `react-hot-toast`
- AI: Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`
- Backend: Node.js + Express
- Deployment: Vercel-ready (`vercel.json`)

## Project Structure

```text
ai-lead-gen-crm/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/
│   ├── routes/
│   ├── prompts/
│   ├── index.js
│   └── package.json
├── sample_leads.csv
├── .env.example
├── vercel.json
└── README.md
```

## Setup

### 1) Clone and install

```bash
git clone <your-repo-url>
cd ai-lead-gen-crm
cd server && npm install
cd ../client && npm install
```

### 2) Environment variables

Copy `.env.example` into `.env` in the project root (or apply same values in server runtime env):

```env
GEMINI_API_KEY=your_gemini_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=
```

### 3) Run locally

Terminal 1 (backend):

```bash
cd server
npm run dev
```

Terminal 2 (frontend):

```bash
cd client
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## Free Gemini API Key (Google AI Studio)

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Open API Keys section and create a new key.
4. Copy key into `GEMINI_API_KEY` in your `.env`.

## Sample CSV Format

Use this header:

```csv
name,role,company,industry,email,phone,linkedin
```

Example file is provided at `sample_leads.csv`.

## API Endpoints

- `POST /api/enrich` -> enrichment JSON
- `POST /api/summarize` -> 3-paragraph summary text
- `POST /api/email` -> email JSON (`subject`, `body`, `cta`)
- `GET /api/health` -> health check

## Reliability and Rate-Limit Handling

- Backend applies a simple per-route queue for AI requests
- 500ms delay is enforced between queued calls
- Gemini response parsing is wrapped in `try/catch`
- Fallback objects/text are returned when parsing/model call fails
- UI surfaces errors and allows retry without crashing

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel project settings:
   - `GEMINI_API_KEY`
   - `PORT` (optional, defaults to platform runtime)
   - `CLIENT_URL` (your deployed client URL)
   - `VITE_API_BASE_URL` (empty for same-origin API)
4. Deploy using included `vercel.json`.
5. After deploy, verify:
   - `/api/health` responds with `ok: true`
   - Lead import and AI actions work from UI

## Security Note

`GEMINI_API_KEY` is used only on the Express backend. No Gemini key is exposed in client-side code.
# ai-lead-gen-crm
