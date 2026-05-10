const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const enrichRouter = require("./routes/enrich");
const summarizeRouter = require("./routes/summarize");
const emailRouter = require("./routes/email");

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "ai-lead-gen-crm-server",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/enrich", enrichRouter);
app.use("/api/summarize", summarizeRouter);
app.use("/api/email", emailRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error("[SERVER_ERROR]", err);

  res.status(err.status || 500).json({
    error: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
