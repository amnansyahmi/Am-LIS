import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "LabFlow LIS API" });
  });

  // Mock endpoint for PDF generation metadata
  app.get("/api/reports/:orderId", (req, res) => {
    // In a real app, this would fetch data from Firestore using admin SDK
    // For now, we return metadata that the client uses for jspdf
    res.json({
      reportId: `REP-${req.params.orderId}`,
      generatedAt: new Date().toISOString(),
      institution: "LabFlow Diagnostic Center"
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LabFlow LIS Server running on http://localhost:${PORT}`);
  });
}

startServer();
