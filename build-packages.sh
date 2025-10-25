#!/bin/bash

# Build script for SimpleVectorDB WASM packages
# This script builds the WASM module and prepares all packages

set -e

echo "🔨 Building SimpleVectorDB WASM Packages"
echo "========================================"

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "❌ Error: Emscripten not found!"
    echo "Please install Emscripten and source the environment:"
    echo "  source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

echo "✓ Emscripten found: $(emcc --version | head -n1)"

# Build native C++ binary first
echo ""
echo "📁 Creating native build directory..."
mkdir -p build
cd build

echo ""
echo "⚙️  Configuring native C++ build with CMake..."
cmake ..

echo ""
echo "🔧 Building native C++ binary..."
make

# Check if native build succeeded
if [ ! -f "SimpleHNSW" ]; then
    echo "❌ Native build failed: SimpleHNSW binary not found"
    exit 1
fi

echo "✓ Native C++ build successful"
echo "✓ Binary available at: build-native/SimpleHNSW"

# Return to root
cd ..

# Build WASM module
echo ""
echo "📁 Creating WASM build directory..."
mkdir -p build-wasm
cd build-wasm

# Configure with CMake
echo ""
echo "⚙️  Configuring WASM build with CMake..."
emcmake cmake -DEMSCRIPTEN=1 ..

# Build
echo ""
echo "🔧 Building WASM module..."
emmake make

# Check if build succeeded
if [ ! -f "simple-vectordb.js" ] || [ ! -f "simple-vectordb.wasm" ]; then
    echo "❌ WASM build failed: Output files not found"
    exit 1
fi

echo "✓ WASM build successful"

# Copy files to package
echo ""
echo "📦 Copying files to package..."
cp simple-vectordb.js ../packages/simple-vectordb-wasm/
cp simple-vectordb.wasm ../packages/simple-vectordb-wasm/

echo "✓ Files copied to packages/simple-vectordb-wasm/"

# Return to root
cd ..

echo ""
echo "✅ All builds complete!"
echo ""
echo "Built artifacts:"
echo "  • Native C++ binary: build-native/SimpleHNSW"
echo "  • WASM module: packages/simple-vectordb-wasm/"
echo ""
echo "Next steps:"
echo "  1. Run native binary: ./build-native/SimpleHNSW"
echo "  2. cd packages/simple-vectordb-wasm && npm publish"
echo "  3. cd packages/react-simple-vectordb && npm publish"
echo "  4. cd packages/angular-simple-vectordb && npm publish"
