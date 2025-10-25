# Building and Installing SimpleVectorDB Python Package

## Prerequisites

Before building the Python package, ensure you have:

- Python 3.7 or higher
- CMake 3.10 or higher
- C++17 compatible compiler (gcc, clang, or MSVC)
- pip and setuptools

## Installation Methods

### Method 1: Install from Source (Recommended)

```bash
# Navigate to the Python package directory
cd packages/simple-vectordb-python

# Install dependencies
pip install numpy

# Install the package in development mode
pip install -e .

# Or install normally
pip install .
```

### Method 2: Build C++ Extension Separately

If you prefer to build the C++ extension separately:

```bash
# From the project root directory
mkdir -p build
cd build

# Configure with Python bindings
cmake -DPYTHON_BINDINGS=ON ..

# Build
make

# The SimpleHNSW.so (or .pyd on Windows) will be created in the build directory
# Copy it to your Python site-packages or add build directory to PYTHONPATH
```

## Verifying Installation

Test that the bindings work:

```python
# Test basic import
from simple_vectordb import VectorDB

# Create a database
db = VectorDB()

# Insert some vectors
db.insert([1.0, 2.0, 3.0])
db.insert([1.1, 2.1, 3.1])

# Search
results = db.search([1.0, 2.0, 3.0], k=1)
print(f"Search results: {results}")
```

## Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=simple_vectordb --cov-report=html
```

## Running Examples

```bash
cd packages/simple-vectordb-python
python example.py
```

## Common Issues

### Issue: CMake not found
**Solution**: Install CMake:
- macOS: `brew install cmake`
- Ubuntu: `sudo apt-get install cmake`
- Windows: Download from https://cmake.org/download/

### Issue: pybind11 not found
**Solution**: The build process should automatically fetch pybind11, but you can install it manually:
```bash
pip install pybind11
```

### Issue: C++ compiler not found
**Solution**: 
- macOS: Install Xcode Command Line Tools: `xcode-select --install`
- Ubuntu: `sudo apt-get install build-essential`
- Windows: Install Visual Studio with C++ support

### Issue: Import error "SimpleHNSW module not found"
**Solution**: 
1. Make sure you built with `-DPYTHON_BINDINGS=ON`
2. Check that the `.so` or `.pyd` file was created
3. Ensure your PYTHONPATH includes the build directory or the package is installed

### Issue: Symbol not found errors
**Solution**: Rebuild with:
```bash
cd build
rm -rf *
cmake -DPYTHON_BINDINGS=ON ..
make clean
make
```

## Development Setup

For development, install in editable mode with dev dependencies:

```bash
cd packages/simple-vectordb-python

# Install in editable mode with dev tools
pip install -e ".[dev]"

# Format code
black simple_vectordb tests

# Type checking
mypy simple_vectordb

# Run tests
pytest -v
```

## Building Distribution Packages

To create distributable packages:

```bash
cd packages/simple-vectordb-python

# Install build tools
pip install build twine

# Build source and wheel distributions
python -m build

# This creates:
# - dist/simple-vectordb-0.1.0.tar.gz (source distribution)
# - dist/simple_vectordb-0.1.0-*.whl (wheel distribution)
```

## Platform-Specific Notes

### macOS
- Ensure Xcode Command Line Tools are installed
- May need to set `MACOSX_DEPLOYMENT_TARGET` environment variable

### Linux
- Requires `python3-dev` package: `sudo apt-get install python3-dev`
- May need `libstdc++-dev`

### Windows
- Requires Visual Studio with C++ tools
- Use Visual Studio Command Prompt for building
- CMake will automatically detect Visual Studio

## Troubleshooting Build Issues

Enable verbose build output:
```bash
pip install -v -e .
```

Check CMake configuration:
```bash
cmake -DPYTHON_BINDINGS=ON -DCMAKE_VERBOSE_MAKEFILE=ON ..
```

## Next Steps

After installation:
1. Check out the [README.md](README.md) for API documentation
2. Run the examples in [example.py](example.py)
3. Look at the test suite in [tests/test_vectordb.py](tests/test_vectordb.py)
