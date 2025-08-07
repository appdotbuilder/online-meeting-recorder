import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type UpdateRecordingInput, type Recording } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRecording = async (input: UpdateRecordingInput): Promise<Recording> => {
  try {
    // First check if the recording exists
    const existingRecording = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, input.id))
      .execute();

    if (existingRecording.length === 0) {
      throw new Error(`Recording with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: Partial<typeof recordingsTable.$inferInsert> = {
      updated_at: new Date(), // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.duration !== undefined) {
      updateData.duration = input.duration;
    }
    if (input.file_path !== undefined) {
      updateData.file_path = input.file_path;
    }
    if (input.file_size !== undefined) {
      updateData.file_size = input.file_size;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the recording
    const result = await db.update(recordingsTable)
      .set(updateData)
      .where(eq(recordingsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Recording update failed:', error);
    throw error;
  }
};