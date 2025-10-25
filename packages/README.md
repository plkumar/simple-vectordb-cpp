# SimpleVectorDB - React & Angular Packages

WebAssembly-powered vector database packages for React and Angular applications. Built on top of the fast HNSW (Hierarchical Navigable Small World) algorithm implemented in C++.

## 📦 Packages

This monorepo contains three packages:

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
  const { insert, search, isReady } = useVectorDB();

  const handleInsert = () => {
    insert([1.0, 2.0, 3.0]);
  };

  const handleSearch = () => {
    const results = search([1.1, 2.1, 3.1], 5);
    console.log(results);
  };

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleInsert}>Insert</button>
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { VectorDBService } from '@simple-vectordb/angular';

@Component({
  selector: 'app-search',
  template: `
    <button (click)="search()">Search</button>
    <div *ngFor="let result of results">
      Distance: {{ result.distance }}
    </div>
  `
})
export class SearchComponent implements OnInit {
  results = [];

  constructor(private vectorDB: VectorDBService) {}

  async ngOnInit() {
    await this.vectorDB.createDatabase();
    this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe();
  }

  search() {
    this.vectorDB.search([1.1, 2.1, 3.1], 5).subscribe(
      results => this.results = results
    );
  }
}
```

## 🔨 Building from Source

### Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
- CMake 3.10+
- Node.js 14+

### Build WASM Module

```bash
# Set up Emscripten environment
source /path/to/emsdk/emsdk_env.sh

# Create build directory
mkdir build-wasm && cd build-wasm

# Configure with CMake
emcmake cmake -DEMSCRIPTEN=1 ..

# Build
emmake make

# Copy outputs to package
cp simple-vectordb.js simple-vectordb.wasm ../packages/simple-vectordb-wasm/
```

### Build Packages

```bash
# Install dependencies
npm install

# Build all packages (if using a monorepo tool)
npm run build

# Or build individually
cd packages/simple-vectordb-wasm && npm run build
cd packages/react-simple-vectordb && npm run build
cd packages/angular-simple-vectordb && npm run build
```

## 📖 Documentation

- [WASM Package Documentation](./packages/simple-vectordb-wasm/README.md)
- [React Package Documentation](./packages/react-simple-vectordb/README.md)
- [Angular Package Documentation](./packages/angular-simple-vectordb/README.md)

## 🎯 Features

- **Fast HNSW Algorithm**: Efficient approximate nearest neighbor search
- **WebAssembly**: Near-native performance in the browser
- **TypeScript Support**: Full type definitions included
- **Framework Integration**: Purpose-built hooks and services for React and Angular
- **Persistence**: Save and load indexes as JSON
- **Memory Management**: Proper cleanup and resource management

## 📊 Use Cases

- **Semantic Search**: Find similar text embeddings
- **Image Search**: Search similar image vectors
- **Recommendation Systems**: Find similar items
- **Clustering**: Group similar vectors
- **Anomaly Detection**: Find outliers in vector space

## 🧪 Examples

Check out the example applications:

- [React Example](./examples/react-example)
- [Angular Example](./examples/angular-example)

## ⚙️ Configuration

All packages support the following HNSW parameters:

- `L` (default: 5): Number of layers in the graph
- `mL` (default: 0.62): Layer multiplier for level assignment
- `efc` (default: 10): Size of dynamic candidate list during construction

```javascript
// JavaScript/React
const db = new SimpleVectorDB(5, 0.62, 10);

// Angular
await this.vectorDB.createDatabase(5, 0.62, 10);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🔗 Links

- [Original C++ Implementation](../../README.md)
- [HNSW Paper](https://arxiv.org/abs/1603.09320)

## ⚠️ Browser Compatibility

Requires WebAssembly support:
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## 🐛 Known Issues

- Large indexes may consume significant memory
- Browser memory limits apply to WASM heap

## 📮 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review example applications
