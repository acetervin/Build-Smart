import {
  users,
  projects,
  estimates,
  materials,
  suppliers,
  pricing,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Estimate,
  type InsertEstimate,
  type Material,
  type InsertMaterial,
  type Supplier,
  type InsertSupplier,
  type Pricing,
  type InsertPricing,
} from "@shared/schema";
import { db } from "./db";

import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Project operations
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(userId: string, id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(userId: string, id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(userId: string, id: string): Promise<void>;

  // Estimate operations
  getProjectEstimates(userId: string, projectId: string): Promise<Estimate[]>;
  getEstimate(userId: string, id: string): Promise<Estimate | undefined>;
  createEstimate(userId: string, estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(userId: string, id: string, updates: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(userId: string, id: string): Promise<void>;
  getUserRecentEstimates(userId: string, limit?: number): Promise<Estimate[]>;

  // Material operations
  getAllMaterials(): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  
  // Reports operations
  getUserEstimatesInDateRange(userId: string, fromDate?: Date, toDate?: Date, projectId?: string): Promise<Estimate[]>;
  getUserReportsStats(userId: string, fromDate?: Date, toDate?: Date): Promise<{
    totalVolume: number;
    totalCost: number;
    estimatesCount: number;
    materialTotals: Record<string, { volume: number; mass: number; cost: number }>;
  }>;
  
  // Settings operations
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<any>;
  
  // Supplier operations (Phase 2)
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Pricing operations (Phase 2)
  getMaterialPricing(materialId: string): Promise<Pricing[]>;
  upsertPricing(pricing: InsertPricing): Promise<Pricing>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{ totalProjects: number; totalEstimates: number; recentEstimates: Estimate[] }>;
}

export class DatabaseStorage implements IStorage {
  private users = new Map<string, User>();
  private projects = new Map<string, Project>();
  private estimates = new Map<string, Estimate>();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const fullUser: User = { ...userData, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(userData.id, fullUser);
    return fullUser;
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getProject(userId: string, id: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (project && project.userId === userId) return project;
    return undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const fullProject: Project = { ...project, id: `proj-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    this.projects.set(fullProject.id, fullProject);
    return fullProject;
  }

  async updateProject(userId: string, id: string, updates: Partial<InsertProject>): Promise<Project> {
    const project = await this.getProject(userId, id);
    if (!project) throw new Error('Project not found');
    const updatedProject: Project = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(userId: string, id: string): Promise<void> {
    const project = await this.getProject(userId, id);
    if (project) {
      this.projects.delete(id);
      // Also delete related estimates
      Array.from(this.estimates.values()).forEach(est => {
        if (est.projectId === id) this.estimates.delete(est.id);
      });
    }
  }

  // Estimate operations
  async getProjectEstimates(userId: string, projectId: string): Promise<Estimate[]> {
    const project = await this.getProject(userId, projectId);
    if (!project) throw new Error('Project not found');
    return Array.from(this.estimates.values()).filter(e => e.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getEstimate(userId: string, id: string): Promise<Estimate | undefined> {
    const estimate = this.estimates.get(id);
    if (estimate) {
      const project = await this.getProject(userId, estimate.projectId);
      if (project) return estimate;
    }
    return undefined;
  }

  async createEstimate(userId: string, estimate: InsertEstimate): Promise<Estimate> {
    const project = await this.getProject(userId, estimate.projectId);
    if (!project) throw new Error('Project not found');
    const fullEstimate: Estimate = { ...estimate, id: `est-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    this.estimates.set(fullEstimate.id, fullEstimate);
    return fullEstimate;
  }

  async updateEstimate(userId: string, id: string, updates: Partial<InsertEstimate>): Promise<Estimate> {
    const estimate = await this.getEstimate(userId, id);
    if (!estimate) throw new Error('Estimate not found');
    const updatedEstimate: Estimate = { ...estimate, ...updates, updatedAt: new Date() };
    this.estimates.set(id, updatedEstimate);
    return updatedEstimate;
  }

  async deleteEstimate(userId: string, id: string): Promise<void> {
    const estimate = await this.getEstimate(userId, id);
    if (estimate) {
      this.estimates.delete(id);
    }
  }

  async getUserRecentEstimates(userId: string, limit: number = 10): Promise<Estimate[]> {
    return Array.from(this.estimates.values())
      .filter(e => {
        const project = Array.from(this.projects.values()).find(p => p.id === e.projectId);
        return project && project.userId === userId;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // Material operations (Phase 2) - Mock
  async getAllMaterials(): Promise<Material[]> {
    return [
      { id: 'mat-1', name: 'Cement', unit: 'bag', description: 'Portland cement', type: 'cement', createdAt: new Date(), updatedAt: new Date() },
      { id: 'mat-2', name: 'Steel', unit: 'kg', description: 'Rebar steel', type: 'steel', createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const fullMaterial: Material = { ...material, id: `mat-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    // In real app, save to DB
    return fullMaterial;
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material> {
    const materials = await this.getAllMaterials();
    const material = materials.find(m => m.id === id);
    if (!material) throw new Error('Material not found');
    const updatedMaterial: Material = { ...material, ...updates, updatedAt: new Date() };
    // In real app, update DB
    return updatedMaterial;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // Reports operations
  async getUserEstimatesInDateRange(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
    projectId?: string
  ): Promise<Estimate[]> {
    const conditions = [eq(projects.userId, userId)];
    
    if (fromDate) {
      conditions.push(gte(estimates.createdAt, fromDate));
    }
    if (toDate) {
      conditions.push(lte(estimates.createdAt, toDate));
    }
    if (projectId) {
      conditions.push(eq(estimates.projectId, projectId));
    }

    const results = await db
      .select({
        id: estimates.id,
        projectId: estimates.projectId,
        name: estimates.name,
        volumeM3: estimates.volumeM3,
        concreteClass: estimates.concreteClass,
        mixRatio: estimates.mixRatio,
        densities: estimates.densities,
        dryFactor: estimates.dryFactor,
        wastageFactor: estimates.wastageFactor,
        results: estimates.results,
        totalCost: estimates.totalCost,
        createdAt: estimates.createdAt,
        updatedAt: estimates.updatedAt,
      })
      .from(estimates)
      .innerJoin(projects, eq(estimates.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(estimates.createdAt));

    return results;
  }

  async getUserReportsStats(
    userId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    totalVolume: number;
    totalCost: number;
    estimatesCount: number;
    materialTotals: Record<string, { volume: number; mass: number; cost: number }>;
  }> {
    const conditions = [eq(projects.userId, userId)];
    
    if (fromDate) {
      conditions.push(gte(estimates.createdAt, fromDate));
    }
    if (toDate) {
      conditions.push(lte(estimates.createdAt, toDate));
    }

    const estimatesInRange = await db
      .select()
      .from(estimates)
      .innerJoin(projects, eq(estimates.projectId, projects.id))
      .where(and(...conditions));

    const totalVolume = estimatesInRange.reduce((sum, row) => sum + (row.estimates.volumeM3 || 0), 0);
    const totalCost = estimatesInRange.reduce((sum, row) => sum + (row.estimates.totalCost || 0), 0);
    const estimatesCount = estimatesInRange.length;

    // Calculate material totals from results JSON
    const materialTotals: Record<string, { volume: number; mass: number; cost: number }> = {};
    
    estimatesInRange.forEach((row) => {
      const results = row.estimates.results as any;
      if (results && typeof results === 'object') {
        ['cement', 'sand', 'aggregate'].forEach((materialType) => {
          if (results[materialType]) {
            if (!materialTotals[materialType]) {
              materialTotals[materialType] = { volume: 0, mass: 0, cost: 0 };
            }
            materialTotals[materialType].volume += results[materialType].volume || 0;
            materialTotals[materialType].mass += results[materialType].mass || 0;
            materialTotals[materialType].cost += results[materialType].cost || 0;
          }
        });
      }
    });

    return {
      totalVolume,
      totalCost,
      estimatesCount,
      materialTotals,
    };
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const defaultSettings = {
      units: 'metric',
      currency: 'USD',
      defaultDensities: {
        cement: 1440,
        sand: 1600,
        aggregate: 1750,
      },
      defaultMixRatios: {
        'C20/25': { cement: 1, sand: 2, aggregate: 4 },
        'C25/30': { cement: 1, sand: 2, aggregate: 3 },
        'C30/37': { cement: 1, sand: 1.5, aggregate: 3 },
      },
      defaultWastageFactor: 5.0,
      defaultDryFactor: 1.54,
    };

    // Merge default settings with user's custom settings
    const userSettings = user.settings ? JSON.parse(JSON.stringify(user.settings)) : {};
    return { ...defaultSettings, ...userSettings };
  }

  async updateUserSettings(userId: string, settings: any): Promise<any> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        settings: settings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return settings;
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    return [
      { id: 'sup-1', name: 'ABC Suppliers', contact: 'abc@suppliers.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sup-2', name: 'XYZ Materials', contact: 'xyz@materials.com', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const fullSupplier: Supplier = { ...supplier, id: `sup-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    // In real app, save to DB
    return fullSupplier;
  }

  // Pricing operations (Phase 2) - Mock
  async getMaterialPricing(materialId: string): Promise<Pricing[]> {
    return [
      { id: 'price-1', materialId, supplierId: 'sup-1', unitPrice: 500, currency: 'USD', lastUpdated: new Date() },
      { id: 'price-2', materialId, supplierId: 'sup-2', unitPrice: 480, currency: 'USD', lastUpdated: new Date() },
    ];
  }

  async upsertPricing(pricingData: InsertPricing): Promise<Pricing> {
    const fullPricing: Pricing = { ...pricingData, id: `price-${Date.now()}`, lastUpdated: new Date() };
    // In real app, upsert to DB
    return fullPricing;
  }

  async getDashboardStats(userId: string): Promise<{ totalProjects: number; totalEstimates: number; recentEstimates: Estimate[] }> {
    const totalProjects = Array.from(this.projects.values()).filter(p => p.userId === userId).length;
    const totalEstimates = Array.from(this.estimates.values()).filter(e => {
      const project = Array.from(this.projects.values()).find(p => p.id === e.projectId);
      return project && project.userId === userId;
    }).length;
    const recentEstimates = await this.getUserRecentEstimates(userId, 5);
    return {
      totalProjects,
      totalEstimates,
      recentEstimates,
    };
  }
}

export const storage = new DatabaseStorage();
