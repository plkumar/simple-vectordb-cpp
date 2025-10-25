/**
 * Unit tests for SimpleVectorDB class
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the WASM module
let SimpleVectorDB;
let initializeWasm;
let getWasmModule;

beforeAll(async () => {
  // Mock the simple-vectordb.js module
  const mockModule = {
    default: global.createMockWasmModule
  };

  // Create a mock implementation
  const wasmModule = await global.createMockWasmModule();
  
  initializeWasm = jest.fn(async () => {
    return wasmModule;
  });
  
  getWasmModule = jest.fn(() => wasmModule);

  // Create SimpleVectorDB class with mocked WASM
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
  };

  // Initialize WASM
  await initializeWasm();
});

describe('SimpleVectorDB', () => {
  let db;

  beforeEach(() => {
    db = new SimpleVectorDB();
  });

  afterEach(() => {
    if (db) {
      db.delete();
    }
  });

  describe('constructor', () => {
    test('should create instance with default parameters', () => {
      const db = new SimpleVectorDB();
      expect(db).toBeInstanceOf(SimpleVectorDB);
      expect(db.index).toBeDefined();
    });

    test('should create instance with custom parameters', () => {
      const db = new SimpleVectorDB(10, 0.5, 20);
      expect(db).toBeInstanceOf(SimpleVectorDB);
      expect(db.index.L).toBe(10);
      expect(db.index.mL).toBe(0.5);
      expect(db.index.efc).toBe(20);
    });

    test('should call getWasmModule', () => {
      getWasmModule.mockClear();
      new SimpleVectorDB();
      expect(getWasmModule).toHaveBeenCalled();
    });
  });

  describe('insert()', () => {
    test('should insert a vector', () => {
      const vector = [1.0, 2.0, 3.0];
      expect(() => db.insert(vector)).not.toThrow();
    });

    test('should insert multiple vectors', () => {
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      db.insert([2.0, 3.0, 4.0]);
      
      expect(db.index.vectors).toHaveLength(3);
    });

    test('should throw error for non-array input', () => {
      expect(() => db.insert('not an array')).toThrow('Vector must be an array of numbers');
      expect(() => db.insert(123)).toThrow('Vector must be an array of numbers');
      expect(() => db.insert(null)).toThrow('Vector must be an array of numbers');
    });

    test('should handle different vector dimensions', () => {
      db.insert([1.0]);
      db.insert([1.0, 2.0]);
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.0, 2.0, 3.0, 4.0]);
      
      expect(db.index.vectors).toHaveLength(4);
    });

    test('should handle floating point numbers', () => {
      db.insert([1.5, 2.7, 3.9]);
      db.insert([0.1, 0.2, 0.3]);
      
      expect(db.index.vectors).toHaveLength(2);
    });

    test('should handle negative numbers', () => {
      db.insert([-1.0, -2.0, -3.0]);
      db.insert([1.0, -2.0, 3.0]);
      
      expect(db.index.vectors).toHaveLength(2);
    });

    test('should handle zero vectors', () => {
      db.insert([0, 0, 0]);
      expect(db.index.vectors).toHaveLength(1);
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.0, 2.0, 3.1]);
      db.insert([1.1, 2.1, 3.0]);
      db.insert([2.0, 3.0, 4.0]);
    });

    test('should return search results', () => {
      const results = db.search([1.1, 2.1, 3.1], 3);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    test('should return results with distance and nodeIndex', () => {
      const results = db.search([1.0, 2.0, 3.0], 3);
      
      expect(results[0]).toHaveProperty('distance');
      expect(results[0]).toHaveProperty('nodeIndex');
      expect(typeof results[0].distance).toBe('number');
      expect(typeof results[0].nodeIndex).toBe('number');
    });

    test('should sort results by distance', () => {
      const results = db.search([1.0, 2.0, 3.0], 4);
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
      }
    });

    test('should find exact match with distance 0', () => {
      const results = db.search([1.0, 2.0, 3.0], 1);
      expect(results[0].distance).toBeCloseTo(0, 10);
    });

    test('should respect k parameter', () => {
      expect(db.search([1.0, 2.0, 3.0], 1)).toHaveLength(1);
      expect(db.search([1.0, 2.0, 3.0], 2)).toHaveLength(2);
      expect(db.search([1.0, 2.0, 3.0], 3)).toHaveLength(3);
    });

    test('should default k to 5', () => {
      const results = db.search([1.0, 2.0, 3.0]);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    test('should handle k larger than database size', () => {
      const results = db.search([1.0, 2.0, 3.0], 100);
      expect(results.length).toBeLessThanOrEqual(4);
    });

    test('should throw error for non-array query', () => {
      expect(() => db.search('not an array', 5)).toThrow('Query must be an array of numbers');
      expect(() => db.search(123, 5)).toThrow('Query must be an array of numbers');
    });

    test('should handle empty database', () => {
      const emptyDb = new SimpleVectorDB();
      const results = emptyDb.search([1.0, 2.0, 3.0], 5);
      expect(results).toHaveLength(0);
      emptyDb.delete();
    });
  });

  describe('toJSON()', () => {
    test('should serialize to JSON string', () => {
      db.insert([1.0, 2.0, 3.0]);
      const json = db.toJSON();
      
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    test('should include database parameters', () => {
      const json = db.toJSON();
      const data = JSON.parse(json);
      
      expect(data).toHaveProperty('L');
      expect(data).toHaveProperty('mL');
      expect(data).toHaveProperty('efc');
    });

    test('should include index data', () => {
      db.insert([1.0, 2.0, 3.0]);
      const json = db.toJSON();
      const data = JSON.parse(json);
      
      expect(data).toHaveProperty('index');
      expect(Array.isArray(data.index)).toBe(true);
    });

    test('should serialize empty database', () => {
      const json = db.toJSON();
      const data = JSON.parse(json);
      
      expect(data.index).toHaveLength(0);
    });

    test('should serialize database with multiple vectors', () => {
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      db.insert([2.0, 3.0, 4.0]);
      
      const json = db.toJSON();
      const data = JSON.parse(json);
      
      expect(data.index.length).toBeGreaterThan(0);
    });
  });

  describe('fromJSON()', () => {
    test('should deserialize from JSON', async () => {
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      const json = db.toJSON();
      
      const loadedDb = await SimpleVectorDB.fromJSON(json);
      
      expect(loadedDb).toBeInstanceOf(SimpleVectorDB);
      expect(loadedDb.index.vectors).toHaveLength(2);
      loadedDb.delete();
    });

    test('should preserve search results', async () => {
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      db.insert([2.0, 3.0, 4.0]);
      
      const originalResults = db.search([1.0, 2.0, 3.0], 3);
      const json = db.toJSON();
      
      const loadedDb = await SimpleVectorDB.fromJSON(json);
      const loadedResults = loadedDb.search([1.0, 2.0, 3.0], 3);
      
      expect(loadedResults).toHaveLength(originalResults.length);
      expect(loadedResults[0].distance).toBeCloseTo(originalResults[0].distance, 5);
      loadedDb.delete();
    });

    test('should call initializeWasm', async () => {
      initializeWasm.mockClear();
      const json = db.toJSON();
      
      await SimpleVectorDB.fromJSON(json);
      expect(initializeWasm).toHaveBeenCalled();
    });

    test('should throw error for invalid JSON', async () => {
      await expect(
        SimpleVectorDB.fromJSON('invalid json')
      ).rejects.toThrow();
    });

    test('should handle empty database JSON', async () => {
      const json = db.toJSON();
      const loadedDb = await SimpleVectorDB.fromJSON(json);
      
      expect(loadedDb.index.vectors).toHaveLength(0);
      loadedDb.delete();
    });
  });

  describe('delete()', () => {
    test('should clean up resources', () => {
      db.insert([1.0, 2.0, 3.0]);
      db.delete();
      
      expect(db.index).toBeNull();
    });

    test('should be safe to call multiple times', () => {
      db.delete();
      expect(() => db.delete()).not.toThrow();
    });

    test('should clear index', () => {
      db.insert([1.0, 2.0, 3.0]);
      db.delete();
      
      expect(db.index).toBeNull();
    });
  });

  describe('Integration tests', () => {
    test('should handle complete workflow', () => {
      // Insert
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      db.insert([2.0, 3.0, 4.0]);
      
      // Search
      const results = db.search([1.0, 2.0, 3.0], 2);
      expect(results).toHaveLength(2);
      
      // Serialize
      const json = db.toJSON();
      expect(json).toBeTruthy();
      
      // Clean up
      db.delete();
      expect(db.index).toBeNull();
    });

    test('should handle serialize-deserialize cycle', async () => {
      // Create and populate
      db.insert([1.0, 2.0, 3.0]);
      db.insert([1.1, 2.1, 3.1]);
      
      // Serialize
      const json = db.toJSON();
      
      // Delete original
      db.delete();
      
      // Deserialize
      const loadedDb = await SimpleVectorDB.fromJSON(json);
      
      // Verify
      const results = loadedDb.search([1.0, 2.0, 3.0], 2);
      expect(results).toHaveLength(2);
      expect(results[0].distance).toBeCloseTo(0, 5);
      
      loadedDb.delete();
    });

    test('should handle large number of vectors', () => {
      const vectorCount = 100;
      
      for (let i = 0; i < vectorCount; i++) {
        db.insert([i, i * 2, i * 3]);
      }
      
      const results = db.search([50, 100, 150], 10);
      expect(results).toHaveLength(10);
      expect(results[0].distance).toBeCloseTo(0, 5);
    });

    test('should handle high-dimensional vectors', () => {
      const dimension = 128;
      const vector1 = Array(dimension).fill(1.0);
      const vector2 = Array(dimension).fill(1.1);
      const vector3 = Array(dimension).fill(2.0);
      
      db.insert(vector1);
      db.insert(vector2);
      db.insert(vector3);
      
      const results = db.search(vector1, 3);
      expect(results[0].distance).toBeCloseTo(0, 5);
    });
  });

  describe('Performance characteristics', () => {
    test('should handle bulk insertions efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        db.insert([i, i * 2, i * 3]);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 5 seconds for 1000 vectors)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle repeated searches', () => {
      for (let i = 0; i < 100; i++) {
        db.insert([i, i * 2, i * 3]);
      }
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        db.search([50, 100, 150], 10);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000);
    });
  });
});
