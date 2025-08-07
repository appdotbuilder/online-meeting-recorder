import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { type CreateRecordingInput } from '../schema';
import { createRecording } from '../handlers/create_recording';
import { eq, gte, between, and } from 'drizzle-orm';

// Test inputs with different scenarios
const basicTestInput: CreateRecordingInput = {
  title: 'Test Recording',
  duration: 3600, // 1 hour in seconds
  file_path: '/recordings/test-recording.mp4',
  file_size: 1024000, // 1MB
  status: 'completed'
};

const minimalTestInput: CreateRecordingInput = {
  title: 'Minimal Recording',
  status: 'recording' // Required field, will use default but must be explicit in type
};

const recordingOnlyTestInput: CreateRecordingInput = {
  title: 'Recording in Progress',
  status: 'recording'
};

describe('createRecording', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a recording with all fields', async () => {
    const result = await createRecording(basicTestInput);

    // Basic field validation
    expect(result.title).toEqual('Test Recording');
    expect(result.duration).toEqual(3600);
    expect(result.file_path).toEqual('/recordings/test-recording.mp4');
    expect(result.file_size).toEqual(1024000);
    expect(result.status).toEqual('completed');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a recording with minimal required fields', async () => {
    const result = await createRecording(minimalTestInput);

    // Basic field validation
    expect(result.title).toEqual('Minimal Recording');
    expect(result.duration).toBeNull();
    expect(result.file_path).toBeNull();
    expect(result.file_size).toBeNull();
    expect(result.status).toEqual('recording'); // Default value
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a recording with recording status', async () => {
    const result = await createRecording(recordingOnlyTestInput);

    // Verify recording status and null fields
    expect(result.title).toEqual('Recording in Progress');
    expect(result.duration).toBeNull();
    expect(result.file_path).toBeNull();
    expect(result.file_size).toBeNull();
    expect(result.status).toEqual('recording');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save recording to database', async () => {
    const result = await createRecording(basicTestInput);

    // Query using proper drizzle syntax
    const recordings = await db.select()
      .from(recordingsTable)
      .where(eq(recordingsTable.id, result.id))
      .execute();

    expect(recordings).toHaveLength(1);
    const dbRecording = recordings[0];
    expect(dbRecording.title).toEqual('Test Recording');
    expect(dbRecording.duration).toEqual(3600);
    expect(dbRecording.file_path).toEqual('/recordings/test-recording.mp4');
    expect(dbRecording.file_size).toEqual(1024000);
    expect(dbRecording.status).toEqual('completed');
    expect(dbRecording.created_at).toBeInstanceOf(Date);
    expect(dbRecording.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const testInput: CreateRecordingInput = {
      title: 'Test with Nulls',
      duration: null,
      file_path: null,
      file_size: null,
      status: 'failed'
    };

    const result = await createRecording(testInput);

    expect(result.title).toEqual('Test with Nulls');
    expect(result.duration).toBeNull();
    expect(result.file_path).toBeNull();
    expect(result.file_size).toBeNull();
    expect(result.status).toEqual('failed');
  });

  it('should query recordings by date range correctly', async () => {
    // Create test recording
    await createRecording(basicTestInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - step by step
    const recordings = await db.select()
      .from(recordingsTable)
      .where(
        and(
          gte(recordingsTable.created_at, yesterday),
          between(recordingsTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(recordings.length).toBeGreaterThan(0);
    recordings.forEach(recording => {
      expect(recording.created_at).toBeInstanceOf(Date);
      expect(recording.created_at >= yesterday).toBe(true);
      expect(recording.created_at <= tomorrow).toBe(true);
    });
  });

  it('should create multiple recordings with unique IDs', async () => {
    const result1 = await createRecording({
      title: 'First Recording',
      status: 'completed'
    });

    const result2 = await createRecording({
      title: 'Second Recording',
      status: 'recording'
    });

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Recording');
    expect(result2.title).toEqual('Second Recording');
    expect(result1.status).toEqual('completed');
    expect(result2.status).toEqual('recording');
  });

  it('should handle different file sizes correctly', async () => {
    const testInputs = [
      { ...basicTestInput, file_size: 0, title: 'Empty File' },
      { ...basicTestInput, file_size: 999999999, title: 'Large File' }
    ];

    for (const input of testInputs) {
      const result = await createRecording(input);
      expect(result.file_size).toEqual(input.file_size);
      expect(result.title).toEqual(input.title);
    }
  });

  it('should handle different duration values correctly', async () => {
    const testInputs = [
      { ...basicTestInput, duration: 0, title: 'Zero Duration' },
      { ...basicTestInput, duration: 86400, title: 'Full Day Duration' } // 24 hours
    ];

    for (const input of testInputs) {
      const result = await createRecording(input);
      expect(result.duration).toEqual(input.duration);
      expect(result.title).toEqual(input.title);
    }
  });
});