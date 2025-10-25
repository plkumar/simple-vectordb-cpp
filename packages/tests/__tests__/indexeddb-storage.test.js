/**
 * Unit tests for IndexedDB Storage functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { IndexedDBStorage } from '../indexeddb-storage.js';

describe('IndexedDBStorage', () => {
  const testDbName = 'test-vectors';
  const testData = JSON.stringify({ test: 'data', vectors: [[1, 2, 3]] });
  const testMetadata = { description: 'Test database', version: '1.0' };

  afterEach(async () => {
    // Clean up after each test
    try {
      await IndexedDBStorage.clear();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('save()', () => {
    test('should save data to IndexedDB', async () => {
      await IndexedDBStorage.save(testDbName, testData, testMetadata);
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.data).toBe(testData);
      expect(result.metadata).toEqual(testMetadata);
    });

    test('should save with empty metadata', async () => {
      await IndexedDBStorage.save(testDbName, testData);
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.data).toBe(testData);
      expect(result.metadata).toEqual({});
    });

    test('should overwrite existing data', async () => {
      await IndexedDBStorage.save(testDbName, testData, { version: '1.0' });
      await IndexedDBStorage.save(testDbName, testData, { version: '2.0' });
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.metadata.version).toBe('2.0');
    });

    test('should store timestamp', async () => {
      const beforeSave = Date.now();
      await IndexedDBStorage.save(testDbName, testData);
      const afterSave = Date.now();
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(result.timestamp).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('load()', () => {
    test('should load saved data', async () => {
      await IndexedDBStorage.save(testDbName, testData, testMetadata);
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.data).toBe(testData);
      expect(result.metadata).toEqual(testMetadata);
      expect(typeof result.timestamp).toBe('number');
    });

    test('should throw error for non-existent database', async () => {
      await expect(
        IndexedDBStorage.load('non-existent')
      ).rejects.toThrow('Index "non-existent" not found');
    });

    test('should load multiple databases independently', async () => {
      await IndexedDBStorage.save('db1', 'data1', { id: 1 });
      await IndexedDBStorage.save('db2', 'data2', { id: 2 });
      
      const result1 = await IndexedDBStorage.load('db1');
      const result2 = await IndexedDBStorage.load('db2');
      
      expect(result1.data).toBe('data1');
      expect(result2.data).toBe('data2');
      expect(result1.metadata.id).toBe(1);
      expect(result2.metadata.id).toBe(2);
    });
  });

  describe('delete()', () => {
    test('should delete stored database', async () => {
      await IndexedDBStorage.save(testDbName, testData);
      await IndexedDBStorage.delete(testDbName);
      
      await expect(
        IndexedDBStorage.load(testDbName)
      ).rejects.toThrow();
    });

    test('should not throw error when deleting non-existent database', async () => {
      await expect(
        IndexedDBStorage.delete('non-existent')
      ).resolves.not.toThrow();
    });

    test('should not affect other databases', async () => {
      await IndexedDBStorage.save('db1', 'data1');
      await IndexedDBStorage.save('db2', 'data2');
      
      await IndexedDBStorage.delete('db1');
      
      const result = await IndexedDBStorage.load('db2');
      expect(result.data).toBe('data2');
    });
  });

  describe('list()', () => {
    test('should return empty array when no databases exist', async () => {
      const list = await IndexedDBStorage.list();
      expect(list).toEqual([]);
    });

    test('should list all stored databases', async () => {
      await IndexedDBStorage.save('db1', 'data1', { desc: 'First' });
      await IndexedDBStorage.save('db2', 'data2', { desc: 'Second' });
      await IndexedDBStorage.save('db3', 'data3', { desc: 'Third' });
      
      const list = await IndexedDBStorage.list();
      
      expect(list).toHaveLength(3);
      expect(list.map(item => item.name)).toContain('db1');
      expect(list.map(item => item.name)).toContain('db2');
      expect(list.map(item => item.name)).toContain('db3');
    });

    test('should include metadata in list', async () => {
      const metadata = { description: 'Test', version: '1.0' };
      await IndexedDBStorage.save(testDbName, testData, metadata);
      
      const list = await IndexedDBStorage.list();
      
      expect(list[0].name).toBe(testDbName);
      expect(list[0].metadata).toEqual(metadata);
      expect(typeof list[0].timestamp).toBe('number');
    });

    test('should not include data in list (only metadata)', async () => {
      await IndexedDBStorage.save(testDbName, testData, testMetadata);
      
      const list = await IndexedDBStorage.list();
      
      expect(list[0]).not.toHaveProperty('data');
    });
  });

  describe('exists()', () => {
    test('should return true for existing database', async () => {
      await IndexedDBStorage.save(testDbName, testData);
      
      const exists = await IndexedDBStorage.exists(testDbName);
      expect(exists).toBe(true);
    });

    test('should return false for non-existent database', async () => {
      const exists = await IndexedDBStorage.exists('non-existent');
      expect(exists).toBe(false);
    });

    test('should return false after deletion', async () => {
      await IndexedDBStorage.save(testDbName, testData);
      await IndexedDBStorage.delete(testDbName);
      
      const exists = await IndexedDBStorage.exists(testDbName);
      expect(exists).toBe(false);
    });
  });

  describe('clear()', () => {
    test('should remove all databases', async () => {
      await IndexedDBStorage.save('db1', 'data1');
      await IndexedDBStorage.save('db2', 'data2');
      await IndexedDBStorage.save('db3', 'data3');
      
      await IndexedDBStorage.clear();
      
      const list = await IndexedDBStorage.list();
      expect(list).toHaveLength(0);
    });

    test('should allow saving after clear', async () => {
      await IndexedDBStorage.save('db1', 'data1');
      await IndexedDBStorage.clear();
      await IndexedDBStorage.save('db2', 'data2');
      
      const list = await IndexedDBStorage.list();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('db2');
    });
  });

  describe('getStorageSize()', () => {
    test('should return 0 for empty storage', async () => {
      const size = await IndexedDBStorage.getStorageSize();
      expect(size).toBe(0);
    });

    test('should return approximate size of stored data', async () => {
      const data = JSON.stringify({ large: 'x'.repeat(1000) });
      await IndexedDBStorage.save(testDbName, data, { meta: 'data' });
      
      const size = await IndexedDBStorage.getStorageSize();
      expect(size).toBeGreaterThan(1000);
    });

    test('should include metadata in size calculation', async () => {
      const data = 'small';
      const metadata = { large: 'x'.repeat(1000) };
      await IndexedDBStorage.save(testDbName, data, metadata);
      
      const size = await IndexedDBStorage.getStorageSize();
      expect(size).toBeGreaterThan(1000);
    });

    test('should sum size of multiple databases', async () => {
      await IndexedDBStorage.save('db1', 'x'.repeat(500));
      await IndexedDBStorage.save('db2', 'x'.repeat(500));
      
      const size = await IndexedDBStorage.getStorageSize();
      expect(size).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Edge cases', () => {
    test('should handle large data', async () => {
      const largeData = JSON.stringify({ 
        vectors: Array(1000).fill([1, 2, 3, 4, 5]) 
      });
      
      await IndexedDBStorage.save(testDbName, largeData);
      const result = await IndexedDBStorage.load(testDbName);
      
      expect(result.data).toBe(largeData);
    });

    test('should handle special characters in name', async () => {
      const specialName = 'test-db_123.vectors';
      await IndexedDBStorage.save(specialName, testData);
      
      const result = await IndexedDBStorage.load(specialName);
      expect(result.data).toBe(testData);
    });

    test('should handle empty string data', async () => {
      await IndexedDBStorage.save(testDbName, '');
      
      const result = await IndexedDBStorage.load(testDbName);
      expect(result.data).toBe('');
    });

    test('should handle complex metadata', async () => {
      const complexMetadata = {
        nested: { data: { structure: true } },
        array: [1, 2, 3],
        string: 'test',
        number: 42,
        boolean: true,
        null: null
      };
      
      await IndexedDBStorage.save(testDbName, testData, complexMetadata);
      const result = await IndexedDBStorage.load(testDbName);
      
      expect(result.metadata).toEqual(complexMetadata);
    });
  });

  describe('Concurrent operations', () => {
    test('should handle multiple saves in parallel', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        IndexedDBStorage.save(`db${i}`, `data${i}`)
      );
      
      await Promise.all(promises);
      
      const list = await IndexedDBStorage.list();
      expect(list).toHaveLength(10);
    });

    test('should handle save and load in parallel', async () => {
      await IndexedDBStorage.save('db1', 'data1');
      
      const [, result] = await Promise.all([
        IndexedDBStorage.save('db2', 'data2'),
        IndexedDBStorage.load('db1')
      ]);
      
      expect(result.data).toBe('data1');
    });
  });
});
