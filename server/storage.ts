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
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Estimate operations
  getProjectEstimates(projectId: string): Promise<Estimate[]>;
  getEstimate(id: string): Promise<Estimate | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Estimate operations
  async getProjectEstimates(projectId: string): Promise<Estimate[]> {
    return await db
      .select()
      .from(estimates)
      .where(eq(estimates.projectId, projectId))
      .orderBy(desc(estimates.updatedAt));
  }

  async getEstimate(id: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate;
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await db.insert(estimates).values(estimate).returning();
    return newEstimate;
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async deleteEstimate(id: string): Promise<void> {
    await db.delete(estimates).where(eq(estimates.id, id));
  }

  async getUserRecentEstimates(userId: string, limit: number = 10): Promise<Estimate[]> {
    return await db
      .select({
        id: estimates.id,
        projectId: estimates.projectId,
        name: estimates.name,
        volumeM3: estimates.volumeM3,
        concreteClass: estimates.concreteClass,
        totalCost: estimates.totalCost,
        createdAt: estimates.createdAt,
        updatedAt: estimates.updatedAt,
        mixRatio: estimates.mixRatio,
        densities: estimates.densities,
        dryFactor: estimates.dryFactor,
        wastageFactor: estimates.wastageFactor,
        results: estimates.results,
      })
      .from(estimates)
      .innerJoin(projects, eq(estimates.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(estimates.updatedAt))
      .limit(limit);
  }

  // Material operations
  async getAllMaterials(): Promise<Material[]> {
    return await db.select().from(materials).orderBy(materials.type, materials.name);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material> {
    const [updatedMaterial] = await db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
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
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  // Pricing operations
  async getMaterialPricing(materialId: string): Promise<Pricing[]> {
    return await db
      .select()
      .from(pricing)
      .where(eq(pricing.materialId, materialId))
      .orderBy(pricing.unitPrice);
  }

  async upsertPricing(pricingData: InsertPricing): Promise<Pricing> {
    const [price] = await db
      .insert(pricing)
      .values(pricingData)
      .onConflictDoUpdate({
        target: [pricing.supplierId, pricing.materialId],
        set: {
          ...pricingData,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return price;
  }
}

export const storage = new DatabaseStorage();
