import createSimpleVectorDB from './simple-vectordb.js';
import { IndexedDBStorage } from './indexeddb-storage.js';

let wasmModule = null;

/**
 * Initialize the WASM module
 */
export async function initializeWasm() {
  if (!wasmModule) {
    wasmModule = await createSimpleVectorDB();
  }
  return wasmModule;
}

/**
 * Get the initialized WASM module
 */
export function getWasmModule() {
  if (!wasmModule) {
    throw new Error('WASM module not initialized. Call initializeWasm() first.');
  }
  return wasmModule;
}

/**
 * SimpleVectorDB class wrapper
 */
export class SimpleVectorDB {
  constructor(L = 5, mL = 0.62, efc = 10) {
    const module = getWasmModule();
    this.index = new module.SimpleHNSWIndex(L, mL, efc);
  }

  /**
   * Insert a vector into the index
   * @param {number[]} vector - The vector to insert
   */
  insert(vector) {
    if (!Array.isArray(vector)) {
      throw new Error('Vector must be an array of numbers');
    }
    this.index.insert(vector);
  }

  /**
   * Search for k nearest neighbors
   * @param {number[]} query - Query vector
   * @param {number} k - Number of results to return
   * @returns {Array<{distance: number, nodeIndex: number}>}
   */
  search(query, k = 5) {
    if (!Array.isArray(query)) {
      throw new Error('Query must be an array of numbers');
    }
    return this.index.search(query, k);
  }

  /**
   * Serialize the index to JSON
   * @returns {string}
   */
  toJSON() {
    return this.index.toJSON();
  }

  /**
   * Load an index from JSON
   * @param {string} json - JSON string representation
   * @returns {SimpleVectorDB}
   */
  static async fromJSON(json) {
    await initializeWasm();
    const module = getWasmModule();
    const instance = Object.create(SimpleVectorDB.prototype);
    instance.index = module.SimpleHNSWIndex.fromJSON(json);
    return instance;
  }

  /**
   * Clean up the index
   */
  delete() {
    if (this.index) {
      this.index.delete();
      this.index = null;
    }
  }

  /**
   * Save the index to IndexedDB
   * @param {string} name - Name/key for the stored index
   * @param {Object} metadata - Optional metadata to store with the index
   * @returns {Promise<void>}
   */
  async saveToIndexedDB(name, metadata = {}) {
    const json = this.toJSON();
    await IndexedDBStorage.save(name, json, metadata);
  }

  /**
   * Load an index from IndexedDB
   * @param {string} name - Name/key of the stored index
   * @returns {Promise<SimpleVectorDB>}
   */
  static async loadFromIndexedDB(name) {
    const { data } = await IndexedDBStorage.load(name);
    return SimpleVectorDB.fromJSON(data);
  }

  /**
   * Delete an index from IndexedDB
   * @param {string} name - Name/key of the stored index
   * @returns {Promise<void>}
   */
  static async deleteFromIndexedDB(name) {
    await IndexedDBStorage.delete(name);
  }

  /**
   * List all stored indexes in IndexedDB
   * @returns {Promise<Array<{id: string, name: string, timestamp: number, metadata: Object}>>}
   */
  static async listIndexedDBIndexes() {
    return IndexedDBStorage.list();
  }

  /**
   * Check if an index exists in IndexedDB
   * @param {string} name - Name/key of the index
   * @returns {Promise<boolean>}
   */
  static async indexedDBExists(name) {
    return IndexedDBStorage.exists(name);
  }

  /**
   * Clear all indexes from IndexedDB
   * @returns {Promise<void>}
   */
  static async clearIndexedDB() {
    await IndexedDBStorage.clear();
  }
}

// Export IndexedDBStorage for advanced usage
export { IndexedDBStorage };

export default SimpleVectorDB;
