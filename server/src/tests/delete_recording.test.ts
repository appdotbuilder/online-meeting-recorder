import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type DeleteRecordingInput } from '../schema';
import { deleteRecording } from '../handlers/delete_recording';
import { eq } from 'drizzle-orm';

describe('deleteRecording', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing recording successfully', async () => {
    // First, create a test recording
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Test Recording to Delete',
        duration: 300,
        file_path: '/recordings/test.mp4',
        file_size: 1024000,
        status: 'completed'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    // Verify the recording exists before deletion
    const beforeDeletion = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, recordingId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    // Delete the recording
    const deleteInput: DeleteRecordingInput = { id: recordingId };
    const result = await deleteRecording(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify the recording no longer exists in the database
    const afterDeletion = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, recordingId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent recording', async () => {
    const nonExistentId = 999999;
    const deleteInput: DeleteRecordingInput = { id: nonExistentId };

    // Attempt to delete non-existent recording should throw error
    await expect(deleteRecording(deleteInput)).rejects.toThrow(/Recording with id 999999 not found/i);

    // Verify no records were affected
    const allRecordings = await db.select()
      .from(recordingsTable)
      .execute();

    expect(allRecordings).toHaveLength(0);
  });

  it('should delete recording with minimal data (only required fields)', async () => {
    // Create a recording with only required fields
    const minimalRecording = await db.insert(recordingsTable)
      .values({
        title: 'Minimal Recording',
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = minimalRecording[0].id;

    // Delete the minimal recording
    const deleteInput: DeleteRecordingInput = { id: recordingId };
    const result = await deleteRecording(deleteInput);

    expect(result.success).toBe(true);

    // Verify deletion
    const afterDeletion = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, recordingId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });

  it('should delete one recording without affecting others', async () => {
    // Create multiple test recordings
    const recordings = await db.insert(recordingsTable)
      .values([
        {
          title: 'Recording 1',
          duration: 120,
          status: 'completed'
        },
        {
          title: 'Recording 2',
          duration: 240,
          status: 'recording'
        },
        {
          title: 'Recording 3',
          duration: 360,
          status: 'failed'
        }
      ])
      .returning()
      .execute();

    // Delete the middle recording
    const targetId = recordings[1].id;
    const deleteInput: DeleteRecordingInput = { id: targetId };
    const result = await deleteRecording(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the target recording was deleted
    const remainingRecordings = await db.select()
      .from(recordingsTable)
      .execute();

    expect(remainingRecordings).toHaveLength(2);
    
    // Verify the correct recordings remain
    const remainingIds = remainingRecordings.map(r => r.id);
    expect(remainingIds).toContain(recordings[0].id);
    expect(remainingIds).toContain(recordings[2].id);
    expect(remainingIds).not.toContain(targetId);

    // Verify the content of remaining recordings
    const recording1 = remainingRecordings.find(r => r.id === recordings[0].id);
    const recording3 = remainingRecordings.find(r => r.id === recordings[2].id);
    
    expect(recording1?.title).toBe('Recording 1');
    expect(recording1?.duration).toBe(120);
    expect(recording1?.status).toBe('completed');

    expect(recording3?.title).toBe('Recording 3');
    expect(recording3?.duration).toBe(360);
    expect(recording3?.status).toBe('failed');
  });

  it('should handle different recording statuses correctly', async () => {
    // Create recordings with different statuses
    const recordingsWithStatuses = await db.insert(recordingsTable)
      .values([
        {
          title: 'Recording Status',
          status: 'recording'
        },
        {
          title: 'Completed Status',
          status: 'completed'
        },
        {
          title: 'Failed Status',
          status: 'failed'
        }
      ])
      .returning()
      .execute();

    // Delete each recording regardless of status
    for (const recording of recordingsWithStatuses) {
      const deleteInput: DeleteRecordingInput = { id: recording.id };
      const result = await deleteRecording(deleteInput);
      
      expect(result.success).toBe(true);
      
      // Verify each deletion
      const checkDeleted = await db.select()
        .from(recordingsTable)
        .where(eq(recordingsTable.id, recording.id))
        .execute();
      
      expect(checkDeleted).toHaveLength(0);
    }

    // Verify all recordings are deleted
    const allRecordings = await db.select()
      .from(recordingsTable)
      .execute();

    expect(allRecordings).toHaveLength(0);
  });

  it('should handle edge case with ID 0', async () => {
    // Attempt to delete with ID 0 (which doesn't exist in auto-increment)
    const deleteInput: DeleteRecordingInput = { id: 0 };

    await expect(deleteRecording(deleteInput)).rejects.toThrow(/Recording with id 0 not found/i);
  });
});