import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type UpdateRecordingInput } from '../schema';
import { updateRecording } from '../handlers/update_recording';
import { eq } from 'drizzle-orm';

describe('updateRecording', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a recording with all fields', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Original Title',
        duration: null,
        file_path: null,
        file_size: null,
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      title: 'Updated Title',
      duration: 3600,
      file_path: '/path/to/updated/recording.mp4',
      file_size: 1024000,
      status: 'completed'
    };

    const result = await updateRecording(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(recordingId);
    expect(result.title).toEqual('Updated Title');
    expect(result.duration).toEqual(3600);
    expect(result.file_path).toEqual('/path/to/updated/recording.mp4');
    expect(result.file_size).toEqual(1024000);
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify updated_at is different from created_at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Original Title',
        duration: 1800,
        file_path: '/original/path.mp4',
        file_size: 512000,
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    // Update only title and status
    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      title: 'Partially Updated Title',
      status: 'completed'
    };

    const result = await updateRecording(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.status).toEqual('completed');

    // Verify other fields remained unchanged
    expect(result.duration).toEqual(1800);
    expect(result.file_path).toEqual('/original/path.mp4');
    expect(result.file_size).toEqual(512000);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    // Create a test recording with values
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Test Recording',
        duration: 3600,
        file_path: '/path/to/file.mp4',
        file_size: 1024000,
        status: 'completed'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    // Update nullable fields to null
    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      duration: null,
      file_path: null,
      file_size: null
    };

    const result = await updateRecording(updateInput);

    // Verify fields were set to null
    expect(result.duration).toBeNull();
    expect(result.file_path).toBeNull();
    expect(result.file_size).toBeNull();

    // Verify non-updated fields remained unchanged
    expect(result.title).toEqual('Test Recording');
    expect(result.status).toEqual('completed');
  });

  it('should persist changes to the database', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Database Test',
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      title: 'Updated Database Test',
      duration: 2400,
      status: 'completed'
    };

    await updateRecording(updateInput);

    // Query database directly to verify persistence
    const recordings = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, recordingId))
      .execute();

    expect(recordings).toHaveLength(1);
    const savedRecording = recordings[0];
    expect(savedRecording.title).toEqual('Updated Database Test');
    expect(savedRecording.duration).toEqual(2400);
    expect(savedRecording.status).toEqual('completed');
    expect(savedRecording.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when recording does not exist', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdateRecordingInput = {
      id: nonExistentId,
      title: 'This Should Fail'
    };

    await expect(updateRecording(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle zero values correctly', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Zero Test',
        duration: 3600,
        file_size: 1024000,
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    // Update with zero values (which are valid)
    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      duration: 0,
      file_size: 0
    };

    const result = await updateRecording(updateInput);

    // Verify zero values are set correctly
    expect(result.duration).toEqual(0);
    expect(result.file_size).toEqual(0);
    expect(result.title).toEqual('Zero Test'); // Unchanged
  });

  it('should update status through different transitions', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Status Test',
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;

    // Test recording -> completed transition
    let updateInput: UpdateRecordingInput = {
      id: recordingId,
      status: 'completed'
    };

    let result = await updateRecording(updateInput);
    expect(result.status).toEqual('completed');

    // Test completed -> failed transition
    updateInput = {
      id: recordingId,
      status: 'failed'
    };

    result = await updateRecording(updateInput);
    expect(result.status).toEqual('failed');

    // Test failed -> recording transition
    updateInput = {
      id: recordingId,
      status: 'recording'
    };

    result = await updateRecording(updateInput);
    expect(result.status).toEqual('recording');
  });

  it('should always update the updated_at timestamp', async () => {
    // Create a test recording first
    const testRecording = await db.insert(recordingsTable)
      .values({
        title: 'Timestamp Test',
        status: 'recording'
      })
      .returning()
      .execute();

    const recordingId = testRecording[0].id;
    const originalUpdatedAt = testRecording[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateRecordingInput = {
      id: recordingId,
      title: 'Timestamp Test Updated'
    };

    const result = await updateRecording(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});