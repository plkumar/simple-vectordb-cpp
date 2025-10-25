# simple-vectordb-cpp :: an experimental Vector index for embedding search.

A fast HNSW (Hierarchical Navigable Small World) vector database implementation in C++ with WebAssembly bindings for JavaScript, React, and Angular.

Search Implementation:

![Search](images/search.png)

## 📦 JavaScript/TypeScript Packages

This project includes ready-to-use packages for web applications:

- **[@simple-vectordb/wasm](./packages/simple-vectordb-wasm)** - Core WebAssembly module
- **[@simple-vectordb/react](./packages/react-simple-vectordb)** - React hooks and components
- **[@simple-vectordb/angular](./packages/angular-simple-vectordb)** - Angular service and module

See the [packages documentation](./packages/README.md) for installation and usage.

## 🚀 Quick Start (JavaScript)

```bash
npm install @simple-vectordb/wasm
```

```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

await initializeWasm();
const db = new SimpleVectorDB();

db.insert([1.0, 2.0, 3.0]);
const results = db.search([1.1, 2.1, 3.1], 5);
```

---

### Build

#### Compile

```g++ -std=c++17 main.cpp -o ./main -I ./json/single_include/nlohmann```


To build the project, follow these steps:
1. Create a directory for the build:
    ```bash
    mkdir build
    cd build
    ```
2. Run CMake to configure the project:
    ```bash
    cmake ..
    ```
3. Compile the project:
    ```bash
    make
    ```
4. Run the resulting executable:
    ```bash
    ./SimpleHNSW
    ```


#### Compile for WebAssembly (Packages)

To build the WebAssembly packages for React and Angular:

```bash
# Make sure Emscripten is in your PATH
source /path/to/emsdk/emsdk_env.sh

# Run the build script
./build-packages.sh
```

This will create the WASM module and copy it to the package directories.

#### Compile for WebAssembly (Manual)

```bash
emcc -std=c++17 main.cpp -o ./index.html -I ./json/single_include/nlohmann
```

To build this project for WebAssembly manually, follow these steps:

1. Install Emscripten by following the instructions here.

2. Set up the Emscripten environment:

``` bash
source /path/to/emsdk/emsdk_env.sh
```
3. Create a directory for the build:

``` bash
mkdir build-wasm
cd build-wasm
```
4. Run CMake to configure the project for WebAssembly:

``` bash
cmake -DEMSCRIPTEN=1 -DCMAKE_TOOLCHAIN_FILE=/path/to/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake ..
```
5. Compile the project:


``` bash
make
```
The output will be a WebAssembly module along with an HTML file (SimpleHNSW.html) that you can open in a web browser to run the compiled code.

The main.cpp file should remain the same as before, but you may need to adapt it to interact with JavaScript if necessary. For example, you can use emscripten::val to handle JavaScript interactions or create bindings using Emscripten's --bind feature.