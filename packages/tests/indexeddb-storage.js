/**
 * IndexedDB Storage Manager for SimpleVectorDB
 * Provides persistent storage for vector database indexes
 * 
 * NOTE: This is a copy of the implementation from ../simple-vectordb-wasm/indexeddb-storage.js
 * It's copied here to avoid ES module import issues in Jest tests
 */

const DB_NAME = 'SimpleVectorDB';
const STORE_NAME = 'indexes';
const DB_VERSION = 1;

/**
 * Opens or creates the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * IndexedDB Storage Manager
 */
export class IndexedDBStorage {
  /**
   * Save a vector database index to IndexedDB
   * @param {string} name - Name/key for the index
   * @param {string} json - Serialized index JSON
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<void>}
   */
  static async save(name, json, metadata = {}) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        id: name,
        name: name,
        data: json,
        timestamp: Date.now(),
        metadata: metadata
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to save index: ${request.error}`));
      };
    });
  }

  /**
   * Load a vector database index from IndexedDB
   * @param {string} name - Name/key of the index
   * @returns {Promise<{data: string, metadata: Object, timestamp: number}>}
   */
  static async load(name) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(name);
      
      request.onsuccess = () => {
        db.close();
        if (request.result) {
          resolve({
            data: request.result.data,
            metadata: request.result.metadata || {},
            timestamp: request.result.timestamp
          });
        } else {
          reject(new Error(`Index "${name}" not found`));
        }
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to load index: ${request.error}`));
      };
    });
  }

  /**
   * Delete an index from IndexedDB
   * @param {string} name - Name/key of the index to delete
   * @returns {Promise<void>}
   */
  static async delete(name) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(name);
      
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to delete index: ${request.error}`));
      };
    });
  }

  /**
   * List all stored indexes
   * @returns {Promise<Array<{id: string, name: string, timestamp: number, metadata: Object}>>}
   */
  static async list() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        db.close();
        const results = request.result.map(item => ({
          id: item.id,
          name: item.name,
          timestamp: item.timestamp,
          metadata: item.metadata || {}
        }));
        resolve(results);
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to list indexes: ${request.error}`));
      };
    });
  }

  /**
   * Check if an index exists
   * @param {string} name - Name/key of the index
   * @returns {Promise<boolean>}
   */
  static async exists(name) {
    try {
      await IndexedDBStorage.load(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all stored indexes
   * @returns {Promise<void>}
   */
  static async clear() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to clear indexes: ${request.error}`));
      };
    });
  }

  /**
   * Get the total size of stored data (approximate)
   * @returns {Promise<number>} Size in bytes (approximate)
   */
  static async getStorageSize() {
    const items = await IndexedDBStorage.list();
    let totalSize = 0;
    
    for (const item of items) {
      const data = await IndexedDBStorage.load(item.id);
      // Approximate size: JSON data length + metadata
      totalSize += data.data.length;
      totalSize += JSON.stringify(data.metadata).length;
    }
    
    return totalSize;
  }
}

export default IndexedDBStorage;
