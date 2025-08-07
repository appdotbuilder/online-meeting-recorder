import { z } from 'zod';

// Recording schema for meeting recordings
export const recordingSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.number().nullable(), // Duration in seconds, nullable during creation
  file_path: z.string().nullable(), // Path to the recorded file, nullable during creation
  file_size: z.number().nullable(), // File size in bytes, nullable during creation
  status: z.enum(['recording', 'completed', 'failed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recording = z.infer<typeof recordingSchema>;

// Input schema for creating recordings
export const createRecordingInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  duration: z.number().nonnegative().nullable().optional(), // Optional during creation, can be null
  file_path: z.string().nullable().optional(), // Optional during creation, can be null
  file_size: z.number().nonnegative().nullable().optional(), // Optional during creation, can be null
  status: z.enum(['recording', 'completed', 'failed']).default('recording')
});

export type CreateRecordingInput = z.infer<typeof createRecordingInputSchema>;

// Input schema for updating recordings
export const updateRecordingInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  duration: z.number().nonnegative().nullable().optional(),
  file_path: z.string().nullable().optional(),
  file_size: z.number().nonnegative().nullable().optional(),
  status: z.enum(['recording', 'completed', 'failed']).optional()
});

export type UpdateRecordingInput = z.infer<typeof updateRecordingInputSchema>;

// Input schema for deleting recordings
export const deleteRecordingInputSchema = z.object({
  id: z.number()
});

export type DeleteRecordingInput = z.infer<typeof deleteRecordingInputSchema>;

// Input schema for getting a single recording
export const getRecordingInputSchema = z.object({
  id: z.number()
});

export type GetRecordingInput = z.infer<typeof getRecordingInputSchema>;