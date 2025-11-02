import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin
  settings: jsonb("settings"), // User preferences and settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  location: varchar("location"),
  description: text("description"),
  tags: varchar("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Material definitions table
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // cement, sand, aggregate
  defaultDensity: real("default_density").notNull(), // kg/m³
  unit: varchar("unit").notNull(), // kg, tonnes, bags, m³
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Estimates table
export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: varchar("name").notNull(),
  
  // Input parameters
  volumeM3: real("volume_m3").notNull(),
  concreteClass: varchar("concrete_class").default("C20/25"),
  mixRatio: jsonb("mix_ratio").notNull(), // {cement: 1, sand: 2, agg: 4}
  densities: jsonb("densities").notNull(), // {cement: 1440, sand: 1600, agg: 1750}
  dryFactor: real("dry_factor").default(1.54),
  wastageFactor: real("wastage_factor").default(5.0), // percentage
  
  // Calculated results
  results: jsonb("results").notNull(), // Complete BoM calculation results
  totalCost: real("total_cost").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table (for Phase 2 pricing)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contact: varchar("contact"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  apiEndpoint: varchar("api_endpoint"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing table (for Phase 2)
export const pricing = pgTable("pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  materialId: varchar("material_id").notNull().references(() => materials.id),
  unitPrice: real("unit_price").notNull(),
  currency: varchar("currency").default("USD"),
  minQuantity: real("min_quantity").default(0),
  maxQuantity: real("max_quantity"),
  leadTimeDays: integer("lead_time_days").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  estimates: many(estimates),
}));

export const estimatesRelations = relations(estimates, ({ one }) => ({
  project: one(projects, { fields: [estimates.projectId], references: [projects.id] }),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  pricing: many(pricing),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  pricing: many(pricing),
}));

export const pricingRelations = relations(pricing, ({ one }) => ({
  supplier: one(suppliers, { fields: [pricing.supplierId], references: [suppliers.id] }),
  material: one(materials, { fields: [pricing.materialId], references: [materials.id] }),
}));

// Zod schemas for validation
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertPricingSchema = createInsertSchema(pricing).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertPricing = z.infer<typeof insertPricingSchema>;
export type Pricing = typeof pricing.$inferSelect;

// Estimation types
export type MixRatio = {
  cement: number;
  sand: number;
  aggregate: number;
};

export type Densities = {
  cement: number;
  sand: number;
  aggregate: number;
};

export type EstimationInput = {
  volumeM3: number;
  mixRatio: MixRatio;
  densities: Densities;
  dryFactor?: number;
  wastageFactor?: number;
};

export type MaterialResult = {
  volume: number; // m³
  mass: number; // kg
  bags?: number; // for cement
  tonnes: number;
};

export type EstimationResult = {
  cement: MaterialResult;
  sand: MaterialResult;
  aggregate: MaterialResult;
  totals: {
    volume: number;
    mass: number;
    estimatedCost: number;
  };
  parameters: EstimationInput;
};
