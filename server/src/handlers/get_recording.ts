import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type GetRecordingInput, type Recording } from '../schema';
import { eq } from 'drizzle-orm';

export const getRecording = async (input: GetRecordingInput): Promise<Recording | null> => {
  try {
    // Query for the specific recording by ID
    const results = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, input.id))
      .execute();

    // Return null if no recording found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    return results[0];
  } catch (error) {
    console.error('Get recording failed:', error);
    throw error;
  }
};