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

## Building from Source

1. Install Emscripten SDK
2. Run the build script:

```bash
npm run build:wasm
```

This will compile the C++ code to WebAssembly and place the output files in the package directory.

## License

MIT
