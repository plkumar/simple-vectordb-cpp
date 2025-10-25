# SimpleVectorDB Package Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────┐      ┌───────────────────────┐     │
│  │   React Application   │      │  Angular Application  │     │
│  │                       │      │                       │     │
│  │  • Components         │      │  • Components         │     │
│  │  • Pages              │      │  • Services           │     │
│  │  • State Management   │      │  • Modules            │     │
│  └───────────────────────┘      └───────────────────────┘     │
│             │                              │                    │
└─────────────┼──────────────────────────────┼────────────────────┘
              │                              │
              ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Framework Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────┐      ┌───────────────────────┐     │
│  │ @simple-vectordb/react│      │@simple-vectordb/angular│     │
│  │                       │      │                       │     │
│  │  • useSimpleVectorDB  │      │  • VectorDBService    │     │
│  │  • useVectorDB        │      │  • VectorDBModule     │     │
│  │  • useVectorSearch    │      │  • RxJS Observables   │     │
│  │  • VectorDBProvider   │      │  • Dependency Inject. │     │
│  │  • React Hooks        │      │  • Angular Lifecycle  │     │
│  └───────────────────────┘      └───────────────────────┘     │
│             │                              │                    │
│             └──────────────┬───────────────┘                    │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core WASM Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │  @simple-vectordb/wasm         │                │
│              │                                │                │
│              │  • SimpleVectorDB Class        │                │
│              │  • initializeWasm()            │                │
│              │  • Type Conversions            │                │
│              │  • Memory Management           │                │
│              │  • TypeScript Definitions      │                │
│              └────────────────────────────────┘                │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WebAssembly Module                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │  simple-vectordb.wasm          │                │
│              │                                │                │
│              │  Compiled from C++:            │                │
│              │  • SimpleHNSWIndex             │                │
│              │  • HNSW Algorithm              │                │
│              │  • Vector Operations           │                │
│              │  • Distance Calculations       │                │
│              │  • Graph Construction          │                │
│              │  • JSON Serialization          │                │
│              └────────────────────────────────┘                │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      C++ Source Code                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • simple_hnsw.h           - Core HNSW implementation          │
│  • wasm_bindings.cpp       - Emscripten bindings               │
│  • priority_queue.h        - Data structures                   │
│  • lru_cache.h            - Caching utilities                  │
│  • util.cpp               - Helper functions                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


Data Flow
─────────

INSERT:
  App → Framework Layer → WASM Layer → WebAssembly → C++ → Store Vector

SEARCH:
  App → Framework Layer → WASM Layer → WebAssembly → C++ → 
  HNSW Search → Return Results → WASM Layer → Framework Layer → App

SAVE:
  App → Framework Layer → WASM Layer → WebAssembly → C++ → 
  Serialize to JSON → Return String → Framework Layer → App

LOAD:
  App → Framework Layer → WASM Layer → WebAssembly → C++ → 
  Deserialize JSON → Reconstruct Index → WASM Layer → Framework Layer → App


Key Features by Layer
──────────────────────

Application Layer:
  ✓ User Interface
  ✓ Business Logic
  ✓ State Management
  ✓ User Interactions

Framework Layer (React/Angular):
  ✓ Framework Integration
  ✓ Lifecycle Management
  ✓ State Hooks / Services
  ✓ Type Safety
  ✓ Memory Cleanup

Core WASM Layer:
  ✓ JavaScript API
  ✓ Type Conversions
  ✓ WASM Initialization
  ✓ Memory Management
  ✓ Error Handling

WebAssembly Module:
  ✓ Near-native Performance
  ✓ HNSW Algorithm
  ✓ Vector Operations
  ✓ Efficient Memory Usage
  ✓ Cross-platform Binary

C++ Source:
  ✓ High Performance
  ✓ Memory Efficiency
  ✓ Algorithm Implementation
  ✓ Data Structures
  ✓ JSON Serialization


Build Process
─────────────

1. C++ Source Files
      ↓
2. Emscripten Compiler (emcc)
      ↓
3. WebAssembly Module (.wasm + .js)
      ↓
4. Copy to @simple-vectordb/wasm package
      ↓
5. Framework packages depend on WASM package
      ↓
6. Applications use framework packages


Package Dependencies
────────────────────

@simple-vectordb/react
  └── @simple-vectordb/wasm
      └── WebAssembly Runtime

@simple-vectordb/angular
  └── @simple-vectordb/wasm
      └── WebAssembly Runtime

Applications
  └── @simple-vectordb/[react|angular]
      └── @simple-vectordb/wasm
          └── WebAssembly Runtime
```
