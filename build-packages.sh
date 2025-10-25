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

# Create build directory
echo ""
echo "📁 Creating build directory..."
mkdir -p build-wasm-pkg
cd build-wasm-pkg

# Configure with CMake
echo ""
echo "⚙️  Configuring with CMake..."
emcmake cmake -DEMSCRIPTEN=1 ..

# Build
echo ""
echo "🔧 Building WASM module..."
emmake make

# Check if build succeeded
if [ ! -f "simple-vectordb.js" ] || [ ! -f "simple-vectordb.wasm" ]; then
    echo "❌ Build failed: Output files not found"
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
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  1. cd packages/simple-vectordb-wasm && npm publish"
echo "  2. cd packages/react-simple-vectordb && npm publish"
echo "  3. cd packages/angular-simple-vectordb && npm publish"
