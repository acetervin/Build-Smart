import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { estimateMaterials, validateEstimationInput, getPresetMixRatios, DEFAULT_DENSITIES } from "./estimator";
import { generateCSVExport, generateJSONExport, generatePDFHTML, getExportFilename } from "./exports";
import { insertProjectSchema, insertEstimateSchema } from "@shared/schema";
import { z } from "zod";

// Dummy authentication middleware for local dev
function isAuthenticated(req: any, res: any, next: any) {
  req.user = { id: "demo-user" };
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Demo login - accept any email/password
      const user = { id: 'demo-user', email, name: email.split('@')[0], role: 'user' };
      // Upsert user in DB
      await storage.upsertUser(user);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      // Demo signup - accept any data
      const user = { id: `user-${Date.now()}`, email, name, role: 'user' };
      await storage.upsertUser(user);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Magic link send endpoint
  app.post('/api/auth/send-magic-link', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      // Generate a simple token (in real app use JWT or secure token)
      const token = `magic-${Date.now()}-${Buffer.from(email).toString('base64')}`;

      // Store token with user info in memory for demo (in real app use DB or cache)
      storage.upsertUser({ id: token, email, name: email.split('@')[0], role: 'user' });

      // Simulate sending email by logging magic link URL
      const magicLink = `${req.protocol}://${req.get('host')}/magic-login?token=${token}`;
      console.log(`Magic link for ${email}: ${magicLink}`);

      res.json({ message: "Magic link sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  // Magic link verify endpoint
  app.get('/api/auth/verify-magic-link', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') return res.status(400).json({ message: "Token is required" });

      // Validate token by checking if user exists with token as id
      const user = await storage.getUser(token);
      if (!user) return res.status(400).json({ message: "Invalid or expired magic link" });

      // Return user data for client to login
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify magic link" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Estimation API
  const estimationInputSchema = z.object({
    volumeM3: z.number().positive("Volume must be positive"),
    mixRatio: z.object({
      cement: z.number().positive("Cement ratio must be positive"),
      sand: z.number().positive("Sand ratio must be positive"),
      agg: z.number().positive("Aggregate ratio must be positive"),
    }),
    densities: z.object({
      cement: z.number().positive("Cement density must be positive").default(DEFAULT_DENSITIES.cement),
      sand: z.number().positive("Sand density must be positive").default(DEFAULT_DENSITIES.sand),
      agg: z.number().positive("Aggregate density must be positive").default(DEFAULT_DENSITIES.agg),
    }),
    dryFactor: z.number().positive().max(3).default(1.54),
    wastageFactor: z.number().min(0).max(50).default(5.0),
  });

  app.post('/api/v1/estimate', async (req, res) => {
    try {
      const validationErrors = validateEstimationInput(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: "Invalid input parameters", errors: validationErrors });
      }
      const input = estimationInputSchema.parse(req.body);
      const results = estimateMaterials(input);
      res.json({
        results,
        links: {
          downloadCsv: `/api/v1/estimate/export/csv`,
          downloadPdf: `/api/v1/estimate/export/pdf`,
          downloadJson: `/api/v1/estimate/export/json`,
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Estimation failed" });
    }
  });

  // Export endpoints
  app.post('/api/v1/estimate/export/:format', async (req, res) => {
    try {
      const { format } = req.params;
      const { results, projectName, location } = req.body;
      if (!results || !projectName) {
        return res.status(400).json({ message: "Results and project name are required" });
      }
      const options = {
        projectName,
        location,
        estimatorName: "ConstructAI",
        date: new Date(),
      };
      const filename = getExportFilename(projectName, format as any);
      switch (format) {
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(generateCSVExport(results, options));
          break;
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.json(generateJSONExport(results, options));
          break;
        case 'pdf':
          res.setHeader('Content-Type', 'text/html');
          res.send(generatePDFHTML(results, options));
          break;
        default:
          res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Project management
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projects = await storage.getUserProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const project = insertProjectSchema.parse(req.body);
      const newProject = await storage.createProject({ ...project, userId: req.user.id });
      res.status(201).json(newProject);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.user.id, req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.updateProject(req.user.id, req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProject(req.user.id, req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Estimate management
  app.get('/api/projects/:projectId/estimates', isAuthenticated, async (req: any, res) => {
    try {
      const estimates = await storage.getProjectEstimates(req.user.id, req.params.projectId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.post('/api/estimates', isAuthenticated, async (req: any, res) => {
    try {
      const estimate = insertEstimateSchema.parse(req.body);
      const newEstimate = await storage.createEstimate(req.user.id, estimate);
      res.status(201).json(newEstimate);
    } catch (error) {
      res.status(400).json({ message: "Invalid estimate data" });
    }
  });

  app.get('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const estimate = await storage.getEstimate(req.user.id, req.params.id);
      if (!estimate) return res.status(404).json({ message: "Estimate not found" });
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  // Dashboard data
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Material presets and utilities
  app.get('/api/materials/presets', (req, res) => {
    res.json({
      mixRatios: getPresetMixRatios(),
      defaultDensities: DEFAULT_DENSITIES,
    });
  });

  app.get('/api/materials', async (req, res) => {
    try {
      const materials = await storage.getAllMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
