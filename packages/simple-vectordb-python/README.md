# SimpleVectorDB Python

A simple vector database with HNSW (Hierarchical Navigable Small World) indexing for efficient approximate nearest neighbor search.

## Features

- 🚀 Fast approximate nearest neighbor search using HNSW algorithm
- 🎯 Simple and intuitive Python API
- 💾 Save and load indexes to/from disk
- 📊 Support for metadata storage
- 🔢 NumPy integration
- ⚡ C++ backend for performance

## Installation

### From Source

```bash
# Navigate to the package directory
cd packages/simple-vectordb-python

# Install the package
pip install .

# Or for development
pip install -e ".[dev]"
```

### Requirements

- Python >= 3.7
- CMake >= 3.10
- C++17 compatible compiler
- NumPy >= 1.19.0

## Quick Start

```python
from simple_vectordb import VectorDB
import numpy as np

# Create a new database
db = VectorDB(L=5, mL=0.62, efc=10, max_connections=16)

# Insert vectors
db.insert([1.0, 2.0, 3.0], metadata={"id": "vec1", "label": "first"})
db.insert([1.1, 2.1, 3.1], metadata={"id": "vec2", "label": "second"})
db.insert([2.0, 3.0, 4.0], metadata={"id": "vec3", "label": "third"})

# Search for nearest neighbors
results = db.search([1.0, 2.0, 3.0], k=2, return_metadata=True)
for distance, idx, metadata in results:
    print(f"Distance: {distance}, Index: {idx}, Metadata: {metadata}")

# Save to disk
db.save("my_database.json")

# Load from disk
loaded_db = VectorDB.load("my_database.json")
```

## API Reference

### VectorDB

Main class for the vector database.

#### Constructor

```python
VectorDB(L=5, mL=0.62, efc=10, max_connections=16)
```

**Parameters:**
- `L` (int): Number of layers in the hierarchical graph (default: 5)
- `mL` (float): Normalization factor for layer assignment (default: 0.62)
- `efc` (int): Size of the dynamic candidate list during construction (default: 10)
- `max_connections` (int): Maximum number of connections per node (default: 16)

#### Methods

##### `insert(vector, metadata=None)`

Insert a vector into the database.

**Parameters:**
- `vector` (list or np.ndarray): The vector to insert
- `metadata` (dict, optional): Optional metadata to associate with the vector

**Returns:** Index of the inserted vector (int)

##### `insert_batch(vectors, metadata=None)`

Insert multiple vectors into the database.

**Parameters:**
- `vectors` (list of lists or np.ndarray): List of vectors to insert
- `metadata` (list of dicts, optional): Optional metadata for each vector

**Returns:** List of indices for the inserted vectors

##### `search(query, k=1, ef=None, return_metadata=False)`

Search for the k nearest neighbors of a query vector.

**Parameters:**
- `query` (list or np.ndarray): The query vector
- `k` (int): Number of nearest neighbors to return (default: 1)
- `ef` (int, optional): Size of the dynamic candidate list during search
- `return_metadata` (bool): If True, include metadata in results (default: False)

**Returns:** 
- If `return_metadata=False`: List of (distance, index) tuples
- If `return_metadata=True`: List of (distance, index, metadata) tuples

##### `save(filepath)`

Save the database to a JSON file.

**Parameters:**
- `filepath` (str): Path to save the database

##### `load(filepath)` (class method)

Load a database from a JSON file.

**Parameters:**
- `filepath` (str): Path to the saved database

**Returns:** VectorDB instance

##### `to_json()`

Serialize the database to a JSON string.

**Returns:** JSON string

##### `from_json(json_str)` (class method)

Deserialize a database from a JSON string.

**Parameters:**
- `json_str` (str): JSON string representation

**Returns:** VectorDB instance

##### `size()`

Get the number of vectors in the database.

**Returns:** Number of vectors (int)

##### `get_metadata(index)`

Get metadata for a vector at a specific index.

**Parameters:**
- `index` (int): The index of the vector

**Returns:** Metadata dictionary or None

##### `update_metadata(index, metadata)`

Update metadata for a vector at a specific index.

**Parameters:**
- `index` (int): The index of the vector
- `metadata` (dict): New metadata dictionary

## Advanced Usage

### Working with NumPy

```python
import numpy as np
from simple_vectordb import VectorDB

db = VectorDB()

# Insert NumPy arrays
vectors = np.random.rand(100, 128)
db.insert_batch(vectors.tolist())

# Search with NumPy array
query = np.random.rand(128)
results = db.search(query, k=5)
```

### Using Metadata

```python
from simple_vectordb import VectorDB

db = VectorDB()

# Insert with metadata
db.insert([1.0, 2.0, 3.0], metadata={"user_id": 123, "timestamp": "2025-01-01"})
db.insert([1.1, 2.1, 3.1], metadata={"user_id": 456, "timestamp": "2025-01-02"})

# Search with metadata
results = db.search([1.0, 2.0, 3.0], k=2, return_metadata=True)
for distance, idx, metadata in results:
    print(f"User: {metadata['user_id']}, Time: {metadata['timestamp']}")

# Update metadata
db.update_metadata(0, {"user_id": 123, "timestamp": "2025-01-03", "updated": True})
```

### Persistence

```python
from simple_vectordb import VectorDB

# Create and populate database
db = VectorDB()
for i in range(1000):
    db.insert([float(i), float(i*2), float(i*3)])

# Save to disk
db.save("my_vectors.json")

# Later, load from disk
db = VectorDB.load("my_vectors.json")
results = db.search([500.0, 1000.0, 1500.0], k=5)
```

## Performance Tips

1. **Adjust `efc` parameter**: Higher values improve accuracy but slow down construction
2. **Adjust `ef` in search**: Higher values improve search accuracy but slow down queries
3. **Tune `max_connections`**: More connections improve recall but increase memory usage
4. **Batch inserts**: Use `insert_batch()` when inserting many vectors

## Algorithm Parameters

The HNSW algorithm has several parameters that affect performance and accuracy:

- **L (layers)**: More layers can improve search quality for larger datasets
- **mL (layer multiplier)**: Controls the probability distribution for layer assignment
- **efc (construction ef)**: Higher values build a more connected graph (better quality, slower)
- **ef (search ef)**: Higher values search more candidates (better recall, slower)
- **max_connections**: More connections per node improve recall but use more memory

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
