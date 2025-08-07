import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum for recording status
export const recordingStatusEnum = pgEnum('recording_status', ['recording', 'completed', 'failed']);

export const recordingsTable = pgTable('recordings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  duration: integer('duration'), // Duration in seconds, nullable during creation
  file_path: text('file_path'), // Path to the recorded file, nullable during creation
  file_size: integer('file_size'), // File size in bytes, nullable during creation
  status: recordingStatusEnum('status').notNull().default('recording'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Recording = typeof recordingsTable.$inferSelect; // For SELECT operations
export type NewRecording = typeof recordingsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { recordings: recordingsTable };