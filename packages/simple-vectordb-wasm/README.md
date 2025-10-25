# @simple-vectordb/wasm

WebAssembly bindings for SimpleVectorDB - A fast HNSW-based vector database for JavaScript and TypeScript.

## Installation

```bash
npm install @simple-vectordb/wasm
```

## Usage

### Basic Example

```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

// Initialize the WASM module
await initializeWasm();

// Create a new vector database
const db = new SimpleVectorDB(5, 0.62, 10);

// Insert vectors
db.insert([1.0, 2.0, 3.0]);
db.insert([1.0, 2.0, 3.1]);
db.insert([1.1, 2.1, 3.0]);

// Search for similar vectors
const results = db.search([1.1, 2.1, 3.1], 5);
console.log(results);
// Output: [{ distance: 0.1, nodeIndex: 2 }, ...]

// Save to JSON
const json = db.toJSON();

// Load from JSON
const loadedDb = await SimpleVectorDB.fromJSON(json);
```

### Constructor Parameters

- `L` (number, default: 5): Number of layers in the HNSW graph
- `mL` (number, default: 0.62): Layer multiplier parameter
- `efc` (number, default: 10): Construction parameter for nearest neighbor search

## API Reference

### `initializeWasm(): Promise<void>`

Initializes the WebAssembly module. Must be called before using any other functions.

### `class SimpleVectorDB`

#### `constructor(L?: number, mL?: number, efc?: number)`

Creates a new vector database instance.

#### `insert(vector: number[]): void`

Inserts a vector into the database.

#### `search(query: number[], k?: number): SearchResult[]`

Searches for the k nearest neighbors of the query vector.

Returns an array of `SearchResult` objects:
```typescript
interface SearchResult {
  distance: number;
  nodeIndex: number;
}
```

#### `toJSON(): string`

Serializes the database to a JSON string.

#### `static fromJSON(json: string): Promise<SimpleVectorDB>`

Loads a database from a JSON string.

#### `delete(): void`

Frees the memory used by the database. Should be called when the database is no longer needed.

### IndexedDB Persistence

The package includes built-in support for persisting vector databases to browser IndexedDB.

#### `saveToIndexedDB(name: string, metadata?: Object): Promise<void>`

Saves the current database to IndexedDB.

```javascript
const db = new SimpleVectorDB();
db.insert([1.0, 2.0, 3.0]);

// Save with optional metadata
await db.saveToIndexedDB('my-vectors', {
  description: 'Product embeddings',
  version: '1.0',
  createdBy: 'user123'
});
```

#### `static loadFromIndexedDB(name: string): Promise<SimpleVectorDB>`

Loads a database from IndexedDB.

```javascript
const db = await SimpleVectorDB.loadFromIndexedDB('my-vectors');
const results = db.search([1.1, 2.1, 3.1], 5);
```

#### `static deleteFromIndexedDB(name: string): Promise<void>`

Deletes a stored database from IndexedDB.

```javascript
await SimpleVectorDB.deleteFromIndexedDB('my-vectors');
```

#### `static listIndexedDBIndexes(): Promise<StoredIndex[]>`

Lists all stored databases in IndexedDB.

```javascript
const indexes = await SimpleVectorDB.listIndexedDBIndexes();
console.log(indexes);
// Output: [{ id: 'my-vectors', name: 'my-vectors', timestamp: 1698260000000, metadata: {...} }]
```

#### `static indexedDBExists(name: string): Promise<boolean>`

Checks if a database exists in IndexedDB.

```javascript
const exists = await SimpleVectorDB.indexedDBExists('my-vectors');
if (exists) {
  const db = await SimpleVectorDB.loadFromIndexedDB('my-vectors');
}
```

#### `static clearIndexedDB(): Promise<void>`

Clears all stored databases from IndexedDB.

```javascript
await SimpleVectorDB.clearIndexedDB();
```

### Complete IndexedDB Example

```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

await initializeWasm();

// Create and populate database
const db = new SimpleVectorDB();
db.insert([1.0, 2.0, 3.0]);
db.insert([1.1, 2.1, 3.1]);
db.insert([2.0, 3.0, 4.0]);

// Save to IndexedDB
await db.saveToIndexedDB('products', {
  category: 'electronics',
  lastUpdated: new Date().toISOString()
});

// Later, in a new session...
const savedDb = await SimpleVectorDB.loadFromIndexedDB('products');
const results = savedDb.search([1.5, 2.5, 3.5], 3);

// List all saved databases
const allIndexes = await SimpleVectorDB.listIndexedDBIndexes();
console.log('Stored databases:', allIndexes);

// Clean up when done
savedDb.delete();
```

### Advanced: Using IndexedDBStorage Directly

For more control over storage, you can use the `IndexedDBStorage` class directly:

```javascript
import { IndexedDBStorage } from '@simple-vectordb/wasm';

// Save raw JSON data
const json = db.toJSON();
await IndexedDBStorage.save('my-index', json, { version: 2 });

// Load raw data
const { data, metadata, timestamp } = await IndexedDBStorage.load('my-index');
console.log('Saved at:', new Date(timestamp));

// Get storage size
const sizeInBytes = await IndexedDBStorage.getStorageSize();
console.log('Total storage:', sizeInBytes, 'bytes');
```

## Browser Compatibility

IndexedDB features require:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

For Node.js environments, IndexedDB features will not be available.

## Building from Source

1. Install Emscripten SDK
2. Run the build script:

```bash
npm run build:wasm
```

This will compile the C++ code to WebAssembly and place the output files in the package directory.

## License

MIT
