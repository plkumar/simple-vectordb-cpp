/**
 * Test setup file
 * Configures fake-indexeddb and mocks for testing
 */

// Import fake-indexeddb for IndexedDB support in Node.js
import 'fake-indexeddb/auto';

// Polyfill for structuredClone (required by fake-indexeddb)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock WASM module for testing
global.mockWasmModule = {
  SimpleHNSWIndex: class MockSimpleHNSWIndex {
    constructor(L = 5, mL = 0.62, efc = 10) {
      this.L = L;
      this.mL = mL;
      this.efc = efc;
      this.vectors = [];
    }

    insert(vector) {
      this.vectors.push([...vector]);
    }

    search(query, k = 5) {
      // Simple Euclidean distance calculation
      const distances = this.vectors.map((vec, index) => {
        const dist = Math.sqrt(
          vec.reduce((sum, val, i) => sum + Math.pow(val - query[i], 2), 0)
        );
        return { distance: dist, nodeIndex: index };
      });

      // Sort by distance and return top k
      return distances
        .sort((a, b) => a.distance - b.distance)
        .slice(0, k);
    }

    toJSON() {
      return JSON.stringify({
        L: this.L,
        mL: this.mL,
        efc: this.efc,
        index: this.vectors.map(vec => ({
          vector: vec,
          connections: [],
          layerBelow: 0
        }))
      });
    }

    static fromJSON(json) {
      const data = JSON.parse(json);
      const instance = new MockSimpleHNSWIndex(data.L, data.mL, data.efc);
      instance.vectors = data.index.map(node => node.vector);
      return instance;
    }

    delete() {
      this.vectors = [];
    }
  }
};

// Mock WASM module creation
global.createMockWasmModule = async () => {
  return global.mockWasmModule;
};
