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
import { eq, desc, and } from "drizzle-orm";

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
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material>;
  
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

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material> {
    const [updatedMaterial] = await db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
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
