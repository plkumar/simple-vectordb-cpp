# SimpleVectorDB - Package Structure Overview

This document provides an overview of the newly created React and Angular compatible packages.

## 📁 Project Structure

```
simple-vectordb-cpp/
├── wasm_bindings.cpp              # Emscripten bindings for WASM
├── CMakeLists.txt                 # Updated with WASM build configuration
├── build-packages.sh              # Automated build script
├── packages/
│   ├── README.md                  # Main packages documentation
│   ├── simple-vectordb-wasm/      # Core WASM package
│   │   ├── package.json
│   │   ├── index.js               # JavaScript wrapper
│   │   ├── simple-vectordb.d.ts   # TypeScript definitions
│   │   └── README.md
│   ├── react-simple-vectordb/     # React package
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── hooks.js           # React hooks
│   │   │   ├── context.js         # React context
│   │   │   └── index.d.ts
│   │   └── README.md
│   └── angular-simple-vectordb/   # Angular package
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── public-api.ts
│       │   └── lib/
│       │       ├── vector-db.service.ts
│       │       └── vector-db.module.ts
│       └── README.md
└── examples/
    ├── react-example/             # React demo app
    │   ├── package.json
    │   └── src/
    │       └── App.jsx
    └── angular-example/           # Angular demo app
        └── src/
            └── app/
                └── app.component.ts
```

## 🔑 Key Components

### 1. WASM Bindings (`wasm_bindings.cpp`)
- Exposes C++ SimpleHNSWIndex to JavaScript
- Uses Emscripten's embind for automatic bindings
- Handles type conversions between JS arrays and C++ vectors
- Provides JavaScript-friendly API

### 2. Core WASM Package (`@simple-vectordb/wasm`)
- JavaScript wrapper around WASM module
- Handles WASM initialization
- Provides clean API for vector operations
- Full TypeScript support
- Works in both browser and Node.js

### 3. React Package (`@simple-vectordb/react`)
- `useSimpleVectorDB()` - Basic initialization hook
- `useVectorDB()` - Full database management hook
- `useVectorSearch()` - Search state management hook
- `VectorDBProvider` - Context provider component
- Automatic memory cleanup on unmount

### 4. Angular Package (`@simple-vectordb/angular`)
- `VectorDBService` - Injectable service
- `VectorDBModule` - Angular module
- RxJS Observable-based API
- Full Angular lifecycle integration
- Dependency injection support

## 🚀 Building the Packages

### Prerequisites
```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### Build Command
```bash
# From project root
./build-packages.sh
```

This script will:
1. Check for Emscripten installation
2. Create build-wasm-pkg directory
3. Configure with CMake
4. Compile C++ to WASM
5. Copy outputs to packages/simple-vectordb-wasm/

## 📦 Publishing Packages

### 1. Build WASM Module
```bash
./build-packages.sh
```

### 2. Publish to npm
```bash
# Publish core WASM package first
cd packages/simple-vectordb-wasm
npm publish --access public

# Then publish React package
cd ../react-simple-vectordb
npm publish --access public

# Finally publish Angular package
cd ../angular-simple-vectordb
npm publish --access public
```

## 🎯 Usage Examples

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
  
  if (!isReady) return <div>Loading...</div>;
  
  return <button onClick={() => {
    insert([1.0, 2.0, 3.0]);
    const results = search([1.1, 2.1, 3.1], 5);
  }}>Search</button>;
}
```

### Angular
```typescript
import { VectorDBService } from '@simple-vectordb/angular';

@Component({...})
export class MyComponent {
  constructor(private vectorDB: VectorDBService) {}
  
  async ngOnInit() {
    await this.vectorDB.createDatabase();
    this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe();
    this.vectorDB.search([1.1, 2.1, 3.1], 5).subscribe(
      results => console.log(results)
    );
  }
}
```

## 🔧 Configuration

All packages support HNSW configuration:

```javascript
// L: Number of layers (default: 5)
// mL: Layer multiplier (default: 0.62)
// efc: Construction parameter (default: 10)

// React
const { db } = useVectorDB(5, 0.62, 10);

// Angular
await vectorDB.createDatabase(5, 0.62, 10);

// Direct WASM
const db = new SimpleVectorDB(5, 0.62, 10);
```

## 📊 API Comparison

| Operation | WASM | React | Angular |
|-----------|------|-------|---------|
| Initialize | `initializeWasm()` | `useSimpleVectorDB()` | `initialize()` |
| Create DB | `new SimpleVectorDB()` | `useVectorDB()` | `createDatabase()` |
| Insert | `db.insert(vec)` | `insert(vec)` | `insert(vec).subscribe()` |
| Search | `db.search(q, k)` | `search(q, k)` | `search(q, k).subscribe()` |
| Save | `db.toJSON()` | `save()` | `save().subscribe()` |
| Load | `fromJSON(json)` | `load(json)` | `load(json).subscribe()` |

## 🧪 Testing

### Local Development
```bash
# Start React example
cd examples/react-example
npm install
npm start

# Start Angular example
cd examples/angular-example
npm install
ng serve
```

### Browser Compatibility
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## 📝 Notes

1. **Memory Management**: Always call `delete()` on WASM instances when done
2. **Initialization**: WASM must be initialized before use
3. **TypeScript**: Full type definitions included
4. **Bundle Size**: WASM module is ~100KB (varies with optimization)
5. **Performance**: Near-native C++ performance in browser

## 🐛 Troubleshooting

### WASM fails to load
- Check browser console for errors
- Ensure WASM MIME type is correct
- Verify files are served correctly

### Build fails
- Ensure Emscripten is properly installed
- Check CMake version (3.10+)
- Verify all dependencies are available

### Memory errors
- Call `delete()` on unused instances
- Check browser memory limits
- Consider reducing vector count or dimensions

## 🔗 Resources

- [Emscripten Documentation](https://emscripten.org/docs/)
- [HNSW Paper](https://arxiv.org/abs/1603.09320)
- [React Hooks](https://react.dev/reference/react)
- [Angular Services](https://angular.io/guide/architecture-services)
