import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("client"), // client or admin
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: text("date_of_birth"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  language: text("language").default("fr"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  profileImage: text("profile_image"),
});

// Accounts table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountNumber: text("account_number").notNull().unique(),
  accountType: text("account_type").notNull(), // current, savings, etc.
  balance: doublePrecision("balance").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Cards table
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  cardNumber: text("card_number").notNull().unique(),
  cardType: text("card_type").notNull(), // visa, mastercard, etc.
  cardholderName: text("cardholder_name").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  isVirtual: boolean("is_virtual").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").references(() => accounts.id),
  toAccountId: integer("to_account_id").references(() => accounts.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  type: text("type").notNull(), // deposit, withdrawal, transfer, etc.
  status: text("status").notNull().default("completed"), // completed, pending, failed
  reference: text("reference"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  category: text("category"), // salary, groceries, etc.
});

// Verification Steps table
export const verificationSteps = pgTable("verification_steps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  step1Completed: boolean("step1_completed").default(false),
  step1Amount: doublePrecision("step1_amount").default(75.00),
  step1Date: timestamp("step1_date"),
  step2Completed: boolean("step2_completed").default(false),
  step2Amount: doublePrecision("step2_amount").default(150.00),
  step2Date: timestamp("step2_date"),
  step3Completed: boolean("step3_completed").default(false),
  step3Amount: doublePrecision("step3_amount").default(225.00),
  step3Date: timestamp("step3_date"),
  step4Completed: boolean("step4_completed").default(false),
  step4Amount: doublePrecision("step4_amount").default(180.00),
  step4Date: timestamp("step4_date"),
  step5Completed: boolean("step5_completed").default(false),
  step5Amount: doublePrecision("step5_amount").default(95.00),
  step5Date: timestamp("step5_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // transaction, verification, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// System Settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationStepSchema = createInsertSchema(verificationSteps).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Types for insert and select operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertVerificationStep = z.infer<typeof insertVerificationStepSchema>;
export type VerificationStep = typeof verificationSteps.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
