import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { estimateMaterials, validateEstimationInput, getPresetMixRatios, DEFAULT_DENSITIES } from "./estimator";
import { generateCSVExport, generateJSONExport, generatePDFHTML, getExportFilename } from "./exports";
import { insertProjectSchema, insertEstimateSchema, insertMaterialSchema, type EstimationInput } from "@shared/schema";
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
      aggregate: z.number().positive("Aggregate ratio must be positive"),
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

  app.put('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
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
      
      // Parse and whitelist safe fields (exclude projectId, id)
      const { name, volumeM3, concreteClass, mixRatio, densities, dryFactor, wastageFactor, results, totalCost } = insertEstimateSchema.partial().parse(req.body);
      const safeUpdates = { name, volumeM3, concreteClass, mixRatio, densities, dryFactor, wastageFactor, results, totalCost };
      
      const updatedEstimate = await storage.updateEstimate(id, safeUpdates);
      res.json(updatedEstimate);
    } catch (error) {
      console.error("Error updating estimate:", error);
      res.status(500).json({ message: "Failed to update estimate" });
    }
  });

  app.delete('/api/estimates/:id', isAuthenticated, async (req: any, res) => {
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
      
      await storage.deleteEstimate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting estimate:", error);
      res.status(500).json({ message: "Failed to delete estimate" });
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

  // Admin-only material management
  const requireAdmin = (req: any, res: any, next: any) => {
    const userRole = req.user?.claims?.role || 'user';
    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.post('/api/materials', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.get('/api/materials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.put('/api/materials/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      const updates = insertMaterialSchema.partial().parse(req.body);
      const updatedMaterial = await storage.updateMaterial(id, updates);
      res.json(updatedMaterial);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.delete('/api/materials/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      await storage.deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Reports API
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { from, to, projectId } = req.query;
      
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
      const estimates = await storage.getUserEstimatesInDateRange(
        userId,
        fromDate,
        toDate,
        projectId as string
      );
      
      const stats = await storage.getUserReportsStats(
        userId,
        fromDate,
        toDate
      );
      
      res.json({
        estimates,
        stats,
        filters: {
          fromDate,
          toDate,
          projectId,
        },
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get('/api/reports/export/:format', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { format } = req.params;
      const { from, to, projectId } = req.query;
      
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
      const estimates = await storage.getUserEstimatesInDateRange(
        userId,
        fromDate,
        toDate,
        projectId as string
      );
      
      const stats = await storage.getUserReportsStats(
        userId,
        fromDate,
        toDate
      );

      const reportData = {
        estimates,
        stats,
        filters: { fromDate, toDate, projectId },
        generatedAt: new Date(),
      };

      const filename = `report_${fromDate ? fromDate.toISOString().split('T')[0] : 'all'}_to_${toDate ? toDate.toISOString().split('T')[0] : 'all'}.${format}`;

      switch (format) {
        case 'csv':
          // Create CSV content from report data with proper escaping
          let csvContent = 'Date,Project,Estimate,Volume (m³),Cost\n';
          estimates.forEach(est => {
            // Sanitize CSV fields to prevent formula injection
            const sanitizeCsvField = (field: any) => {
              const str = String(field || '');
              // Prefix dangerous characters to prevent formula injection
              if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
                return `"'${str}"`;
              }
              // Escape quotes and wrap in quotes if contains comma or quote
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            };
            
            csvContent += `${est.createdAt?.toISOString().split('T')[0]},${sanitizeCsvField(est.projectId)},${sanitizeCsvField(est.name)},${est.volumeM3},${est.totalCost || 0}\n`;
          });
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(csvContent);
          break;

        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.json(reportData);
          break;

        case 'pdf':
          // Create basic HTML report with proper escaping
          const escapeHtml = (text: any) => {
            const str = String(text || '');
            return str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          };
          
          let htmlContent = `
            <html>
              <head><title>Construction Materials Report</title></head>
              <body>
                <h1>Construction Materials Report</h1>
                <p>Generated: ${new Date().toLocaleDateString()}</p>
                <h2>Summary</h2>
                <p>Total Estimates: ${stats.estimatesCount}</p>
                <p>Total Volume: ${stats.totalVolume.toFixed(2)} m³</p>
                <p>Total Cost: $${stats.totalCost.toFixed(2)}</p>
                <h2>Estimates</h2>
                <table border="1">
                  <tr><th>Date</th><th>Name</th><th>Volume (m³)</th><th>Cost</th></tr>
          `;
          estimates.forEach(est => {
            htmlContent += `<tr><td>${est.createdAt?.toISOString().split('T')[0]}</td><td>${escapeHtml(est.name)}</td><td>${est.volumeM3}</td><td>$${est.totalCost || 0}</td></tr>`;
          });
          htmlContent += '</table></body></html>';
          res.setHeader('Content-Type', 'text/html');
          res.send(htmlContent);
          break;

        default:
          res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting reports:", error);
      res.status(500).json({ message: "Failed to export reports" });
    }
  });

  // Settings API
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = req.body;
      
      const updatedSettings = await storage.updateUserSettings(userId, settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
