import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recordingsTable } from '../db/schema';
import { getRecordings } from '../handlers/get_recordings';

describe('getRecordings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recordings exist', async () => {
    const result = await getRecordings();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all recordings ordered by created_at desc', async () => {
    // Create test recordings with different timestamps
    const recording1 = await db.insert(recordingsTable)
      .values({
        title: 'First Recording',
        status: 'recording'
      })
      .returning()
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const recording2 = await db.insert(recordingsTable)
      .values({
        title: 'Second Recording',
        duration: 1800,
        file_path: '/recordings/second.mp4',
        file_size: 2048000,
        status: 'completed'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const recording3 = await db.insert(recordingsTable)
      .values({
        title: 'Third Recording',
        status: 'failed'
      })
      .returning()
      .execute();

    const results = await getRecordings();

    // Should return all 3 recordings
    expect(results).toHaveLength(3);

    // Should be ordered by created_at desc (newest first)
    expect(results[0].title).toEqual('Third Recording');
    expect(results[1].title).toEqual('Second Recording');
    expect(results[2].title).toEqual('First Recording');

    // Verify timestamps are in descending order
    expect(results[0].created_at >= results[1].created_at).toBe(true);
    expect(results[1].created_at >= results[2].created_at).toBe(true);
  });

  it('should return recordings with all field types correctly', async () => {
    // Create a recording with all fields populated
    await db.insert(recordingsTable)
      .values({
        title: 'Complete Recording',
        duration: 3600,
        file_path: '/recordings/complete.mp4',
        file_size: 5242880,
        status: 'completed'
      })
      .execute();

    const results = await getRecordings();

    expect(results).toHaveLength(1);
    const recording = results[0];

    // Verify all field types and values
    expect(typeof recording.id).toBe('number');
    expect(recording.title).toBe('Complete Recording');
    expect(typeof recording.duration).toBe('number');
    expect(recording.duration).toBe(3600);
    expect(typeof recording.file_path).toBe('string');
    expect(recording.file_path).toBe('/recordings/complete.mp4');
    expect(typeof recording.file_size).toBe('number');
    expect(recording.file_size).toBe(5242880);
    expect(recording.status).toBe('completed');
    expect(recording.created_at).toBeInstanceOf(Date);
    expect(recording.updated_at).toBeInstanceOf(Date);
  });

  it('should handle recordings with nullable fields', async () => {
    // Create a recording with nullable fields as null
    await db.insert(recordingsTable)
      .values({
        title: 'Minimal Recording',
        duration: null,
        file_path: null,
        file_size: null,
        status: 'recording'
      })
      .execute();

    const results = await getRecordings();

    expect(results).toHaveLength(1);
    const recording = results[0];

    // Verify nullable fields are handled correctly
    expect(recording.title).toBe('Minimal Recording');
    expect(recording.duration).toBeNull();
    expect(recording.file_path).toBeNull();
    expect(recording.file_size).toBeNull();
    expect(recording.status).toBe('recording');
    expect(recording.id).toBeDefined();
    expect(recording.created_at).toBeInstanceOf(Date);
    expect(recording.updated_at).toBeInstanceOf(Date);
  });

  it('should handle recordings with different status values', async () => {
    // Create recordings with each possible status
    await db.insert(recordingsTable)
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
      .execute();

    const results = await getRecordings();

    expect(results).toHaveLength(3);

    // Verify all status types are returned correctly
    const statuses = results.map(r => r.status).sort();
    expect(statuses).toEqual(['completed', 'failed', 'recording']);
  });

  it('should maintain consistent ordering across multiple calls', async () => {
    // Create multiple recordings
    await db.insert(recordingsTable)
      .values([
        { title: 'Recording A', status: 'recording' },
        { title: 'Recording B', status: 'completed' },
        { title: 'Recording C', status: 'failed' }
      ])
      .execute();

    // Call getRecordings multiple times
    const results1 = await getRecordings();
    const results2 = await getRecordings();

    // Results should be identical
    expect(results1).toHaveLength(3);
    expect(results2).toHaveLength(3);

    // Order should be consistent
    for (let i = 0; i < results1.length; i++) {
      expect(results1[i].id).toBe(results2[i].id);
      expect(results1[i].title).toBe(results2[i].title);
    }
  });

  it('should handle large datasets efficiently', async () => {
    // Create multiple recordings to test performance
    const recordingsData = Array.from({ length: 20 }, (_, index) => ({
      title: `Recording ${index + 1}`,
      duration: (index + 1) * 600,
      status: index % 3 === 0 ? 'completed' as const : 
              index % 3 === 1 ? 'recording' as const : 'failed' as const
    }));

    await db.insert(recordingsTable)
      .values(recordingsData)
      .execute();

    const startTime = Date.now();
    const results = await getRecordings();
    const endTime = Date.now();

    // Verify all records are returned
    expect(results).toHaveLength(20);

    // Verify ordering is maintained (newest first)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }

    // Performance should be reasonable (under 100ms for 20 records)
    expect(endTime - startTime).toBeLessThan(100);
  });
});