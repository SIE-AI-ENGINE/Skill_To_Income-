import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const sieProfilesTable = pgTable("sie_profiles", {
  id: serial("id").primaryKey(),
  // One profile per user. Created automatically the first time a signed-in
  // user's profile is requested (see `ensureProfileForUser` in the api-server).
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  experience: text("experience").notNull(),
  goals: jsonb("goals").$type<string[]>().notNull(),
  availability: text("availability").notNull(),
  platforms: jsonb("platforms").$type<string[]>().notNull(),
  incomeGoal: text("income_goal").notNull(),
  workType: text("work_type").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  completion: integer("completion").notNull().default(76),
  // True once the user has completed (or skipped) the onboarding flow.
  onboarded: boolean("onboarded").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sieAssetsTable = pgTable("sie_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  responses: integer("responses").notNull().default(0),
  content: text("content"),
  opportunityId: text("opportunity_id"),
});

export const insertSieProfileSchema = createInsertSchema(sieProfilesTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSieProfile = z.infer<typeof insertSieProfileSchema>;
export type SieProfile = typeof sieProfilesTable.$inferSelect;

export const insertSieAssetSchema = createInsertSchema(sieAssetsTable).omit({
  createdAt: true,
});
export type InsertSieAsset = z.infer<typeof insertSieAssetSchema>;
export type SieAsset = typeof sieAssetsTable.$inferSelect;
