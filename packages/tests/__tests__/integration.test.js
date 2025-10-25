/**
 * Integration tests for SimpleVectorDB with IndexedDB
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { IndexedDBStorage } from '../indexeddb-storage.js';

// Mock SimpleVectorDB with IndexedDB methods
let SimpleVectorDB;

beforeAll(async () => {
  // Mock the WASM module
  const wasmModule = await global.createMockWasmModule();
  
  const initializeWasm = async () => wasmModule;
  const getWasmModule = () => wasmModule;

  // Create SimpleVectorDB class with IndexedDB integration
  SimpleVectorDB = class {
    constructor(L = 5, mL = 0.62, efc = 10) {
      const module = getWasmModule();
      this.index = new module.SimpleHNSWIndex(L, mL, efc);
    }

    insert(vector) {
      if (!Array.isArray(vector)) {
        throw new Error('Vector must be an array of numbers');
      }
      this.index.insert(vector);
    }

    search(query, k = 5) {
      if (!Array.isArray(query)) {
        throw new Error('Query must be an array of numbers');
      }
      return this.index.search(query, k);
    }

    toJSON() {
      return this.index.toJSON();
    }

    static async fromJSON(json) {
      await initializeWasm();
      const module = getWasmModule();
      const instance = Object.create(SimpleVectorDB.prototype);
      instance.index = module.SimpleHNSWIndex.fromJSON(json);
      return instance;
    }

    delete() {
      if (this.index) {
        this.index.delete();
        this.index = null;
      }
    }

    // IndexedDB methods
    async saveToIndexedDB(name, metadata = {}) {
      const json = this.toJSON();
      await IndexedDBStorage.save(name, json, metadata);
    }

    static async loadFromIndexedDB(name) {
      const data = await IndexedDBStorage.load(name);
      return await SimpleVectorDB.fromJSON(data.data);
    }

    static async deleteFromIndexedDB(name) {
      await IndexedDBStorage.delete(name);
    }

    static async listIndexedDBIndexes() {
      return await IndexedDBStorage.list();
    }

    static async existsInIndexedDB(name) {
      return await IndexedDBStorage.exists(name);
    }

    static async clearIndexedDB() {
      await IndexedDBStorage.clear();
    }

    static async getIndexedDBStorageSize() {
      return await IndexedDBStorage.getStorageSize();
    }
  };

  await initializeWasm();
});

describe('SimpleVectorDB + IndexedDB Integration', () => {
  let db;
  const testIndexName = 'test-integration-index';

  beforeEach(() => {
    db = new SimpleVectorDB();
  });

  afterEach(async () => {
    if (db) {
      db.delete();
    }
    // Clean up IndexedDB
    try {
      await IndexedDBStorage.clear();
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Complete workflow', () => {
    test('should create, populate, save, load, and search', async () => {
      // 1. Create and populate
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      db.insert([2.0, 3.0, 4.0]);
      
      // 2. Verify data
      const results1 = db.search([1.0, 2.0, 3.0], 2);
      expect(results1).toHaveLength(2);
      
      // 3. Save to IndexedDB
      await db.saveToIndexedDB(testIndexName, {
        description: 'Integration test index',
        vectorCount: 3
      });
      
      // 4. Verify saved
      const exists = await SimpleVectorDB.existsInIndexedDB(testIndexName);
      expect(exists).toBe(true);
      
      // 5. Delete original
      db.delete();
      
      // 6. Load from IndexedDB
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      
      // 7. Verify loaded data
      const results2 = db.search([1.0, 2.0, 3.0], 2);
      expect(results2).toHaveLength(2);
      expect(results2[0].distance).toBeCloseTo(results1[0].distance, 5);
    });

    test('should handle multiple save/load cycles', async () => {
      // Cycle 1
      db.insert([1.0, 2.0, 3.0]);
      await db.saveToIndexedDB(testIndexName);
      db.delete();
      
      // Cycle 2
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      db.insert([1.1, 2.1, 3.1]);
      await db.saveToIndexedDB(testIndexName); // Overwrite
      db.delete();
      
      // Cycle 3
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      db.insert([2.0, 3.0, 4.0]);
      await db.saveToIndexedDB(testIndexName); // Overwrite again
      db.delete();
      
      // Verify final state
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      const results = db.search([1.0, 2.0, 3.0], 3);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should maintain index integrity across operations', async () => {
      // Create large index
      for (let i = 0; i < 50; i++) {
        db.insert([i, i * 2, i * 3]);
      }
      
      // Get baseline results
      const baselineResults = db.search([25, 50, 75], 5);
      
      // Save and load
      await db.saveToIndexedDB(testIndexName);
      db.delete();
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      
      // Verify integrity
      const loadedResults = db.search([25, 50, 75], 5);
      
      expect(loadedResults).toHaveLength(baselineResults.length);
      for (let i = 0; i < loadedResults.length; i++) {
        expect(loadedResults[i].distance).toBeCloseTo(baselineResults[i].distance, 5);
      }
    });
  });

  describe('Multiple indexes management', () => {
    test('should manage multiple indexes independently', async () => {
      // Create index 1
      const db1 = new SimpleVectorDB();
      db1.insert([1.0, 2.0, 3.0]);
      await db1.saveToIndexedDB('index1', { type: 'products' });
      
      // Create index 2
      const db2 = new SimpleVectorDB();
      db2.insert([10.0, 20.0, 30.0]);
      await db2.saveToIndexedDB('index2', { type: 'users' });
      
      // Create index 3
      const db3 = new SimpleVectorDB();
      db3.insert([100.0, 200.0, 300.0]);
      await db3.saveToIndexedDB('index3', { type: 'documents' });
      
      // List all indexes
      const indexes = await SimpleVectorDB.listIndexedDBIndexes();
      expect(indexes).toHaveLength(3);
      
      // Load and verify each
      const loaded1 = await SimpleVectorDB.loadFromIndexedDB('index1');
      const results1 = loaded1.search([1.0, 2.0, 3.0], 1);
      expect(results1[0].distance).toBeCloseTo(0, 5);
      
      const loaded2 = await SimpleVectorDB.loadFromIndexedDB('index2');
      const results2 = loaded2.search([10.0, 20.0, 30.0], 1);
      expect(results2[0].distance).toBeCloseTo(0, 5);
      
      const loaded3 = await SimpleVectorDB.loadFromIndexedDB('index3');
      const results3 = loaded3.search([100.0, 200.0, 300.0], 1);
      expect(results3[0].distance).toBeCloseTo(0, 5);
      
      // Clean up
      db1.delete();
      db2.delete();
      db3.delete();
      loaded1.delete();
      loaded2.delete();
      loaded3.delete();
    });

    test('should delete specific indexes without affecting others', async () => {
      // Create multiple indexes
      const db1 = new SimpleVectorDB();
      db1.insert([1.0, 2.0, 3.0]);
      await db1.saveToIndexedDB('keep1');
      
      const db2 = new SimpleVectorDB();
      db2.insert([10.0, 20.0, 30.0]);
      await db2.saveToIndexedDB('delete-me');
      
      const db3 = new SimpleVectorDB();
      db3.insert([100.0, 200.0, 300.0]);
      await db3.saveToIndexedDB('keep2');
      
      // Delete one
      await SimpleVectorDB.deleteFromIndexedDB('delete-me');
      
      // Verify deletion
      const exists = await SimpleVectorDB.existsInIndexedDB('delete-me');
      expect(exists).toBe(false);
      
      // Verify others still exist
      expect(await SimpleVectorDB.existsInIndexedDB('keep1')).toBe(true);
      expect(await SimpleVectorDB.existsInIndexedDB('keep2')).toBe(true);
      
      // Clean up
      db1.delete();
      db2.delete();
      db3.delete();
    });
  });

  describe('Metadata handling', () => {
    test('should preserve metadata through save/load cycle', async () => {
      db.insert([1.0, 2.0, 3.0]);
      
      const metadata = {
        description: 'Test index',
        createdAt: new Date().toISOString(),
        vectorCount: 1,
        tags: ['test', 'integration'],
        config: {
          dimension: 3,
          metric: 'euclidean'
        }
      };
      
      await db.saveToIndexedDB(testIndexName, metadata);
      
      const indexes = await SimpleVectorDB.listIndexedDBIndexes();
      const savedIndex = indexes.find(idx => idx.name === testIndexName);
      
      expect(savedIndex.metadata).toEqual(metadata);
    });

    test('should update metadata on overwrite', async () => {
      db.insert([1.0, 2.0, 3.0]);
      await db.saveToIndexedDB(testIndexName, { version: 1 });
      
      db.insert([1.1, 2.1, 3.1]);
      await db.saveToIndexedDB(testIndexName, { version: 2 });
      
      const indexes = await SimpleVectorDB.listIndexedDBIndexes();
      const savedIndex = indexes.find(idx => idx.name === testIndexName);
      
      expect(savedIndex.metadata.version).toBe(2);
    });
  });

  describe('Storage management', () => {
    test('should track storage size', async () => {
      const sizeBefore = await SimpleVectorDB.getIndexedDBStorageSize();
      
      // Add data
      for (let i = 0; i < 100; i++) {
        db.insert([i, i * 2, i * 3]);
      }
      await db.saveToIndexedDB(testIndexName);
      
      const sizeAfter = await SimpleVectorDB.getIndexedDBStorageSize();
      
      expect(sizeAfter).toBeGreaterThan(sizeBefore);
    });

    test('should reduce storage size after deletion', async () => {
      // Create and save multiple indexes
      for (let i = 0; i < 5; i++) {
        const tempDb = new SimpleVectorDB();
        for (let j = 0; j < 20; j++) {
          tempDb.insert([j, j * 2, j * 3]);
        }
        await tempDb.saveToIndexedDB(`temp-${i}`);
        tempDb.delete();
      }
      
      const sizeBefore = await SimpleVectorDB.getIndexedDBStorageSize();
      
      // Delete all
      await SimpleVectorDB.clearIndexedDB();
      
      const sizeAfter = await SimpleVectorDB.getIndexedDBStorageSize();
      
      expect(sizeAfter).toBeLessThan(sizeBefore);
    });
  });

  describe('Error handling', () => {
    test('should throw error when loading non-existent index', async () => {
      await expect(
        SimpleVectorDB.loadFromIndexedDB('does-not-exist')
      ).rejects.toThrow();
    });

    test('should handle corrupted data gracefully', async () => {
      // Save valid data
      db.insert([1.0, 2.0, 3.0]);
      await db.saveToIndexedDB(testIndexName);
      
      // Manually corrupt the data (simulate by saving invalid JSON)
      await IndexedDBStorage.save(testIndexName, 'invalid json data', {});
      
      // Try to load corrupted data
      await expect(
        SimpleVectorDB.loadFromIndexedDB(testIndexName)
      ).rejects.toThrow();
    });

    test('should handle empty database save', async () => {
      // Save empty database
      await db.saveToIndexedDB(testIndexName);
      
      // Load and verify
      const loadedDb = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      const results = loadedDb.search([1.0, 2.0, 3.0], 5);
      
      expect(results).toHaveLength(0);
      loadedDb.delete();
    });
  });

  describe('Concurrent operations', () => {
    test('should handle concurrent saves', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const tempDb = new SimpleVectorDB();
        tempDb.insert([i, i * 2, i * 3]);
        promises.push(
          tempDb.saveToIndexedDB(`concurrent-${i}`).then(() => tempDb.delete())
        );
      }
      
      await Promise.all(promises);
      
      const indexes = await SimpleVectorDB.listIndexedDBIndexes();
      expect(indexes.length).toBeGreaterThanOrEqual(5);
    });

    test('should handle concurrent loads', async () => {
      // Setup: create multiple indexes
      for (let i = 0; i < 3; i++) {
        const tempDb = new SimpleVectorDB();
        tempDb.insert([i, i * 2, i * 3]);
        await tempDb.saveToIndexedDB(`load-test-${i}`);
        tempDb.delete();
      }
      
      // Load concurrently
      const promises = [
        SimpleVectorDB.loadFromIndexedDB('load-test-0'),
        SimpleVectorDB.loadFromIndexedDB('load-test-1'),
        SimpleVectorDB.loadFromIndexedDB('load-test-2')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((db, i) => {
        const searchResults = db.search([i, i * 2, i * 3], 1);
        expect(searchResults[0].distance).toBeCloseTo(0, 5);
        db.delete();
      });
    });

    test('should handle mixed concurrent operations', async () => {
      const operations = [
        // Saves
        (async () => {
          const db1 = new SimpleVectorDB();
          db1.insert([1, 2, 3]);
          await db1.saveToIndexedDB('mixed-1');
          db1.delete();
        })(),
        
        // List
        SimpleVectorDB.listIndexedDBIndexes(),
        
        // Check existence
        SimpleVectorDB.existsInIndexedDB('mixed-1'),
        
        // More saves
        (async () => {
          const db2 = new SimpleVectorDB();
          db2.insert([4, 5, 6]);
          await db2.saveToIndexedDB('mixed-2');
          db2.delete();
        })(),
        
        // Get storage size
        SimpleVectorDB.getIndexedDBStorageSize()
      ];
      
      const results = await Promise.all(operations);
      
      expect(results[1]).toBeDefined(); // list results
      expect(results[4]).toBeGreaterThanOrEqual(0); // storage size
    });
  });

  describe('Performance', () => {
    test('should handle large index save/load efficiently', async () => {
      // Create large index
      const vectorCount = 500;
      for (let i = 0; i < vectorCount; i++) {
        db.insert([i, i * 2, i * 3, i * 4]);
      }
      
      // Measure save time
      const saveStart = Date.now();
      await db.saveToIndexedDB(testIndexName);
      const saveDuration = Date.now() - saveStart;
      
      // Measure load time
      db.delete();
      const loadStart = Date.now();
      db = await SimpleVectorDB.loadFromIndexedDB(testIndexName);
      const loadDuration = Date.now() - loadStart;
      
      // Verify functionality
      const results = db.search([250, 500, 750, 1000], 5);
      expect(results).toHaveLength(5);
      
      // Performance assertions (should be reasonably fast)
      expect(saveDuration).toBeLessThan(5000);
      expect(loadDuration).toBeLessThan(5000);
    });
  });
});
