import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { estimateMaterials, validateEstimationInput, getPresetMixRatios, DEFAULT_DENSITIES } from "./estimator";
import { generateCSVExport, generateJSONExport, generatePDFHTML, getExportFilename } from "./exports";
import { insertProjectSchema, insertEstimateSchema, type EstimationInput } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
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
    }).default(DEFAULT_DENSITIES),
    dryFactor: z.number().positive().max(3).default(1.54),
    wastageFactor: z.number().min(0).max(50).default(5.0),
  });

  app.post('/api/v1/estimate', async (req, res) => {
    try {
      const validationErrors = validateEstimationInput(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Invalid input parameters", 
          errors: validationErrors 
        });
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
      console.error("Estimation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Estimation failed" 
      });
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
          const csvContent = generateCSVExport(results, options);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(csvContent);
          break;

        case 'json':
          const jsonContent = generateJSONExport(results, options);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.json(jsonContent);
          break;

        case 'pdf':
          const htmlContent = generatePDFHTML(results, options);
          res.setHeader('Content-Type', 'text/html');
          res.send(htmlContent);
          break;

        default:
          res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Project management
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      const userId = req.user.claims.sub;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      const userId = req.user.claims.sub;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, updates);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      const userId = req.user.claims.sub;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Estimate management
  app.get('/api/projects/:projectId/estimates', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify ownership
      const userId = req.user.claims.sub;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const estimates = await storage.getProjectEstimates(projectId);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.post('/api/estimates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify project ownership
      const project = await storage.getProject(req.body.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const estimateData = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(estimateData);
      res.status(201).json(estimate);
    } catch (error) {
      console.error("Error creating estimate:", error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.get('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const estimate = await storage.getEstimate(id);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify ownership through project
      const project = await storage.getProject(estimate.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  // Dashboard data
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [projects, recentEstimates] = await Promise.all([
        storage.getUserProjects(userId),
        storage.getUserRecentEstimates(userId, 5)
      ]);
      
      const totalVolume = recentEstimates.reduce((sum, est) => sum + (est.volumeM3 || 0), 0);
      const totalCost = recentEstimates.reduce((sum, est) => sum + (est.totalCost || 0), 0);
      
      res.json({
        totalProjects: projects.length,
        totalEstimates: recentEstimates.length,
        totalVolume: Math.round(totalVolume),
        costSavings: Math.round(totalCost * 0.15), // Estimated savings
        recentEstimates: recentEstimates.slice(0, 3),
        recentProjects: projects.slice(0, 3),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
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
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
