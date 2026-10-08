import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth UID as identifier
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define 'documents' or user operations table
export const userOperations = pgTable('user_operations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  operationType: text('operation_type').notNull(),
  details: jsonb('details'),
  status: text('status').default('completed'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  operations: many(userOperations),
}));

// Define relationships for the 'userOperations' table
export const userOperationsRelations = relations(userOperations, ({ one }) => ({
  user: one(users, {
    fields: [userOperations.userId],
    references: [users.id],
  }),
}));
