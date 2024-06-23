# simple-vectordb-cpp :: an experimental Vector store embedding search.

This project is inspired by [client-vector-search](https://github.com/yusufhilmi/client-vector-search).


Search Implementaion:

![Search](images/search.png)


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


#### Compile for Web Assembly using Emscripten

``` emcc -std=c++17 main.cpp -o ./index.html -I ./json/single_include/nlohmann ```

To build this project for WebAssembly, follow these steps:

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