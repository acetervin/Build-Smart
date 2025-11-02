import express from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupAuth } from "./replitAuth";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: "results.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startServer = async () => {
  const app = express();

  // Middleware to parse JSON
  app.use(express.json());

  // Set up authentication
  await setupAuth(app);

  // Serve static frontend files
  app.use(express.static(path.join(__dirname, "../dist/client")));

  // Register API routes
  await registerRoutes(app);
  console.log("API routes registered");

  // SPA fallback: must be **after API routes**
  app.get("*", (req, res) => {
    // Only serve index.html for frontend routes
    if (req.path.startsWith("/api")) {
      return res.status(404).send("API route not found");
    }
    res.sendFile(path.join(__dirname, "../dist/client/index.html"));
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
  const HOST = process.env.HOST || "127.0.0.1";

  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running at http://${HOST}:${PORT}`);
  });
};

startServer();

