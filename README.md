# SimpleVectorDB - C++ Vector Database with WebAssembly

A fast HNSW (Hierarchical Navigable Small World) vector database implementation in C++ with WebAssembly bindings for JavaScript, React, and Angular.

![Search Implementation](images/search.png)

## 📦 Packages

This project includes three ready-to-use packages for web applications:

### [@simple-vectordb/wasm](./packages/simple-vectordb-wasm)
Core WebAssembly module with JavaScript/TypeScript bindings.

```bash
npm install @simple-vectordb/wasm
```

### [@simple-vectordb/react](./packages/react-simple-vectordb)
React hooks and components for easy integration.

```bash
npm install @simple-vectordb/react @simple-vectordb/wasm
```

### [@simple-vectordb/angular](./packages/angular-simple-vectordb)
Angular service and module for seamless integration.

```bash
npm install @simple-vectordb/angular @simple-vectordb/wasm
```

## 🚀 Quick Start

### Vanilla JavaScript

```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

// Initialize WASM (do this once)
await initializeWasm();

// Create database
const db = new SimpleVectorDB(5, 0.62, 10);

// Insert vectors
db.insert([1.0, 2.0, 3.0]);

// Search for nearest neighbors
const results = db.search([1.1, 2.1, 3.1], 5);

// Save to JSON
const json = db.toJSON();

// Load from JSON
const db2 = await SimpleVectorDB.fromJSON(json);

// Cleanup
db.delete();
```

### React

```jsx
import { VectorDBProvider, useVectorDB } from '@simple-vectordb/react';

function App() {
  return (
    <VectorDBProvider>
      <VectorSearch />
    </VectorDBProvider>
  );
}

function VectorSearch() {
  const { insert, search, save, load, isReady } = useVectorDB();

  const handleInsert = () => {
    insert([1.0, 2.0, 3.0]);
  };

  const handleSearch = () => {
    const results = search([1.1, 2.1, 3.1], 5);
    console.log(results);
  };

  const handleSave = () => {
    const json = save();
    localStorage.setItem('db', json);
  };

  const handleLoad = async () => {
    const json = localStorage.getItem('db');
    await load(json);
  };

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleInsert}>Insert</button>
      <button onClick={handleSearch}>Search</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Load</button>
    </div>
  );
}
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VectorDBService } from '@simple-vectordb/angular';

@Component({
  selector: 'app-search',
  template: `
    <button (click)="insert()">Insert</button>
    <button (click)="search()">Search</button>
    <button (click)="saveDB()">Save</button>
    <button (click)="loadDB()">Load</button>
    <div *ngFor="let result of results">
      Distance: {{ result.distance }}, Index: {{ result.nodeIndex }}
    </div>
  `
})
export class SearchComponent implements OnInit, OnDestroy {
  results = [];

  constructor(private vectorDB: VectorDBService) {}

  async ngOnInit() {
    await this.vectorDB.createDatabase(5, 0.62, 10);
  }

  insert() {
    this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe(
      () => console.log('Inserted')
    );
  }

  search() {
    this.vectorDB.search([1.1, 2.1, 3.1], 5).subscribe(
      results => this.results = results
    );
  }

  saveDB() {
    this.vectorDB.save().subscribe(
      json => localStorage.setItem('db', json)
    );
  }

  loadDB() {
    const json = localStorage.getItem('db');
    this.vectorDB.load(json).subscribe(
      () => console.log('Loaded')
    );
  }

  ngOnDestroy() {
    this.vectorDB.destroy();
  }
}
```

## 🎯 Features

- **Fast HNSW Algorithm**: Efficient approximate nearest neighbor search
- **WebAssembly**: Near-native C++ performance in the browser
- **TypeScript Support**: Full type definitions included
- **Framework Integration**: Purpose-built hooks and services for React and Angular
- **Persistence**: Save and load indexes as JSON
- **Memory Management**: Proper cleanup and resource management
- **RxJS Integration**: Observable-based API for Angular
- **React Hooks**: Modern React patterns with hooks and context

## 📊 Use Cases

- **Semantic Search**: Find similar text embeddings
- **Image Search**: Search similar image vectors  
- **Recommendation Systems**: Find similar items
- **Clustering**: Group similar vectors
- **Anomaly Detection**: Find outliers in vector space

## ⚙️ Configuration

All packages support HNSW configuration parameters:

```javascript
new SimpleVectorDB(L, mL, efc)
```

**Parameters:**
- **L** (default: 5): Number of layers in HNSW graph
  - Higher = Better recall, more memory
  - Typical range: 3-10

- **mL** (default: 0.62): Layer assignment multiplier
  - Controls layer distribution
  - Usually keep at 0.62

- **efc** (default: 10): Construction search breadth
  - Higher = Better quality, slower build
  - Typical range: 5-50

## 🏗️ Building from Source

### Prerequisites

- C++ compiler with C++17 support
- CMake 3.10+
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (for WebAssembly)
- Node.js 14+ (for packages)

### Build C++ Native

```bash
# Create build directory
mkdir build
cd build

# Configure with CMake
cmake ..

# Compile
make

# Run
./SimpleHNSW
```

### Build WebAssembly (Automated)

```bash
# Set up Emscripten environment
source /path/to/emsdk/emsdk_env.sh

# Run build script (builds and copies to packages)
./build-packages.sh
```

### Build WebAssembly (Manual)

```bash
# Set up Emscripten environment
source /path/to/emsdk/emsdk_env.sh

# Create build directory
mkdir build-wasm
cd build-wasm

# Configure with CMake
emcmake cmake -DEMSCRIPTEN=1 ..

# Build
emmake make

# Copy outputs to package directory
cp simple-vectordb.js simple-vectordb.wasm ../packages/simple-vectordb-wasm/
```

### Publishing Packages

```bash
# Build WASM first
./build-packages.sh

# Publish core WASM package
cd packages/simple-vectordb-wasm
npm publish --access public

# Publish React package
cd ../react-simple-vectordb
npm publish --access public

# Publish Angular package
cd ../angular-simple-vectordb
npm publish --access public
```

## 📁 Project Structure

```
simple-vectordb-cpp/
├── src/                        # C++ source code
│   ├── simple_hnsw.h          # Core HNSW implementation
│   ├── wasm_bindings.cpp      # Emscripten bindings
│   ├── priority_queue.h       # Data structures
│   ├── lru_cache.h           # Caching utilities
│   └── util.cpp              # Helper functions
├── packages/
│   ├── simple-vectordb-wasm/  # Core WASM package
│   │   ├── index.js          # JavaScript wrapper
│   │   ├── simple-vectordb.d.ts  # TypeScript definitions
│   │   └── simple-vectordb.js/.wasm  # Built files
│   ├── react-simple-vectordb/ # React package
│   │   └── src/
│   │       ├── hooks.js      # React hooks
│   │       └── context.js    # React context
│   └── angular-simple-vectordb/  # Angular package
│       └── src/lib/
│           ├── vector-db.service.ts
│           └── vector-db.module.ts
├── examples/
│   ├── react-example/        # React demo app
│   └── angular-example/      # Angular demo app
├── CMakeLists.txt            # CMake configuration
└── build-packages.sh         # Build automation script
```

## 🏛️ Architecture

```
┌─────────────────────────────────────────┐
│     Application Layer                   │
│  (React/Angular Applications)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     Framework Layer                     │
│  (@simple-vectordb/react|angular)       │
│  • Hooks/Services                       │
│  • Lifecycle Management                 │
│  • State Management                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     Core WASM Layer                     │
│  (@simple-vectordb/wasm)                │
│  • JavaScript API                       │
│  • Type Conversions                     │
│  • Memory Management                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     WebAssembly Module                  │
│  (simple-vectordb.wasm)                 │
│  • HNSW Algorithm                       │
│  • Vector Operations                    │
│  • Distance Calculations                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     C++ Implementation                  │
│  • SimpleHNSWIndex                      │
│  • Core algorithms                      │
│  • Data structures                      │
└─────────────────────────────────────────┘
```

## 🧪 Examples

Complete example applications are available:

- [React Example](./examples/react-example)
- [Angular Example](./examples/angular-example)

## 📖 API Reference

### TypeScript Types

```typescript
interface SearchResult {
  distance: number;
  nodeIndex: number;
}

// React
interface UseVectorDBResult {
  db: SimpleVectorDB | null;
  insert: (vector: number[]) => void;
  search: (query: number[], k: number) => SearchResult[];
  save: () => string;
  load: (json: string) => Promise<void>;
  isReady: boolean;
}

// Angular - all methods return Observables
class VectorDBService {
  initialize(): Observable<void>;
  createDatabase(L?: number, mL?: number, efc?: number): Promise<void>;
  insert(vector: number[]): Observable<void>;
  search(query: number[], k: number): Observable<SearchResult[]>;
  save(): Observable<string>;
  load(json: string): Observable<void>;
  destroy(): void;
}
```

## 🚨 Error Handling

### React
```jsx
try {
  insert(vector);
  const results = search(query, k);
} catch (error) {
  console.error('Operation failed:', error);
}
```

### Angular
```typescript
this.vectorDB.search(query, k).subscribe({
  next: results => this.results = results,
  error: error => console.error('Search failed:', error)
});
```

## 🔧 Performance Tips

1. **Batch inserts**: Insert all vectors before searching
2. **Appropriate k**: Don't request more results than needed
3. **Memory management**: Call `delete()` on WASM instances when done
4. **Persistence**: Use binary formats for large databases (future enhancement)
5. **Dimensions**: Keep vector dimensions consistent across all operations

## 🌐 Browser Compatibility

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🔗 Resources

- [HNSW Paper](https://arxiv.org/abs/1603.09320)
- [Emscripten Documentation](https://emscripten.org/docs/)
- [React Documentation](https://react.dev/)
- [Angular Documentation](https://angular.io/)