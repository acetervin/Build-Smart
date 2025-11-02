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
import { eq, desc, and, sql } from "drizzle-orm";

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
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material>;

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

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material> {
    const materials = await this.getAllMaterials();
    const material = materials.find(m => m.id === id);
    if (!material) throw new Error('Material not found');
    const updatedMaterial: Material = { ...material, ...updates, updatedAt: new Date() };
    // In real app, update DB
    return updatedMaterial;
  }

  // Supplier operations (Phase 2) - Mock
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
