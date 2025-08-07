import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type CreateRecordingInput, type Recording } from '../schema';

export const createRecording = async (input: CreateRecordingInput): Promise<Recording> => {
  try {
    // Insert recording record
    const result = await db.insert(recordingsTable)
      .values({
        title: input.title,
        duration: input.duration !== undefined ? input.duration : null,
        file_path: input.file_path !== undefined ? input.file_path : null,
        file_size: input.file_size !== undefined ? input.file_size : null,
        status: input.status
      })
      .returning()
      .execute();

    // Return the created recording
    const recording = result[0];
    return {
      ...recording
    };
  } catch (error) {
    console.error('Recording creation failed:', error);
    throw error;
  }
};