import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type GetRecordingInput } from '../schema';
import { getRecording } from '../handlers/get_recording';

describe('getRecording', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a recording when it exists', async () => {
    // Create a test recording
    const insertResult = await db.insert(recordingsTable)
      .values({
        title: 'Test Meeting Recording',
        duration: 3600,
        file_path: '/recordings/test-meeting.mp4',
        file_size: 1024000,
        status: 'completed'
      })
      .returning()
      .execute();

    const createdRecording = insertResult[0];

    // Test input
    const testInput: GetRecordingInput = {
      id: createdRecording.id
    };

    // Get the recording using the handler
    const result = await getRecording(testInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRecording.id);
    expect(result!.title).toEqual('Test Meeting Recording');
    expect(result!.duration).toEqual(3600);
    expect(result!.file_path).toEqual('/recordings/test-meeting.mp4');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.status).toEqual('completed');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when recording does not exist', async () => {
    // Test input with non-existent ID
    const testInput: GetRecordingInput = {
      id: 999999
    };

    // Get the recording using the handler
    const result = await getRecording(testInput);

    // Should return null for non-existent recording
    expect(result).toBeNull();
  });

  it('should return recording with nullable fields set to null', async () => {
    // Create a recording with minimal data (nullable fields as null)
    const insertResult = await db.insert(recordingsTable)
      .values({
        title: 'Recording in Progress',
        duration: null,
        file_path: null,
        file_size: null,
        status: 'recording'
      })
      .returning()
      .execute();

    const createdRecording = insertResult[0];

    // Test input
    const testInput: GetRecordingInput = {
      id: createdRecording.id
    };

    // Get the recording using the handler
    const result = await getRecording(testInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRecording.id);
    expect(result!.title).toEqual('Recording in Progress');
    expect(result!.duration).toBeNull();
    expect(result!.file_path).toBeNull();
    expect(result!.file_size).toBeNull();
    expect(result!.status).toEqual('recording');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return recording with failed status', async () => {
    // Create a failed recording
    const insertResult = await db.insert(recordingsTable)
      .values({
        title: 'Failed Recording',
        duration: null,
        file_path: null,
        file_size: null,
        status: 'failed'
      })
      .returning()
      .execute();

    const createdRecording = insertResult[0];

    // Test input
    const testInput: GetRecordingInput = {
      id: createdRecording.id
    };

    // Get the recording using the handler
    const result = await getRecording(testInput);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRecording.id);
    expect(result!.title).toEqual('Failed Recording');
    expect(result!.status).toEqual('failed');
  });

  it('should handle multiple recordings and return the correct one', async () => {
    // Create multiple test recordings
    const insertResults = await db.insert(recordingsTable)
      .values([
        {
          title: 'First Recording',
          duration: 1800,
          file_path: '/recordings/first.mp4',
          file_size: 500000,
          status: 'completed'
        },
        {
          title: 'Second Recording',
          duration: 2400,
          file_path: '/recordings/second.mp4',
          file_size: 750000,
          status: 'completed'
        },
        {
          title: 'Third Recording',
          duration: null,
          file_path: null,
          file_size: null,
          status: 'recording'
        }
      ])
      .returning()
      .execute();

    // Get the second recording
    const testInput: GetRecordingInput = {
      id: insertResults[1].id
    };

    const result = await getRecording(testInput);

    // Should return the correct recording
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResults[1].id);
    expect(result!.title).toEqual('Second Recording');
    expect(result!.duration).toEqual(2400);
    expect(result!.file_path).toEqual('/recordings/second.mp4');
    expect(result!.file_size).toEqual(750000);
    expect(result!.status).toEqual('completed');
  });
});