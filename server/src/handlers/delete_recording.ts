import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type DeleteRecordingInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteRecording(input: DeleteRecordingInput): Promise<{ success: boolean }> {
  try {
    // Check if the recording exists before attempting to delete
    const existingRecording = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, input.id))
      .execute();

    if (existingRecording.length === 0) {
      throw new Error(`Recording with id ${input.id} not found`);
    }

    // Delete the recording from the database
    const result = await db.delete(recordingsTable)
      .where(eq(recordingsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Recording deletion failed:', error);
    throw error;
  }
}