import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "footwear",
  "accessory",
]);

export const seasonEnum = pgEnum("season", [
  "all",
  "spring",
  "summer",
  "fall",
  "winter",
]);

export const occasionEnum = pgEnum("occasion", [
  "casual",
  "work",
  "formal",
  "gym",
  "any",
]);

export const modeEnum = pgEnum("mode", ["ai", "offline"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url"),
  generatedCount: integer("generated_count").default(0).notNull(),
  aiCount: integer("ai_count").default(0).notNull(),
  offlineCount: integer("offline_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clothingItems = pgTable("clothing_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: categoryEnum("category").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  season: seasonEnum("season").notNull(),
  occasion: occasionEnum("occasion").notNull(),
  styleTag: varchar("style_tag", { length: 100 }).default(""),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfits = pgTable("outfits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  occasion: varchar("occasion", { length: 50 }).notNull(),
  season: varchar("season", { length: 50 }).notNull(),
  mode: modeEnum("mode").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfitItems = pgTable("outfit_items", {
  id: serial("id").primaryKey(),
  outfitId: integer("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  clothingItemId: integer("clothing_item_id")
    .notNull()
    .references(() => clothingItems.id, { onDelete: "cascade" }),
});
