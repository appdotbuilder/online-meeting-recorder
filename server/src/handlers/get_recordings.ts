import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type Recording } from '../schema';
import { desc } from 'drizzle-orm';

export const getRecordings = async (): Promise<Recording[]> => {
  try {
    // Fetch all recordings ordered by creation date (newest first)
    const results = await db.select()
      .from(recordingsTable)
      .orderBy(desc(recordingsTable.created_at))
      .execute();

    // Return results - no numeric conversion needed as all fields are properly typed
    return results;
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    throw error;
  }
};