# SimpleVectorDB Python - Quick Reference

## Installation

```bash
cd packages/simple-vectordb-python
pip install -e .
```

## Basic Usage

```python
from simple_vectordb import VectorDB

# Create database
db = VectorDB()

# Insert vectors
db.insert([1.0, 2.0, 3.0])
db.insert([1.1, 2.1, 3.1], metadata={"label": "test"})

# Search
results = db.search([1.0, 2.0, 3.0], k=2)
# Returns: [(distance, index), ...]

# Save/Load
db.save("database.json")
db = VectorDB.load("database.json")
```

## API Quick Reference

### Constructor
```python
VectorDB(L=5, mL=0.62, efc=10, max_connections=16)
```

### Methods

| Method | Description | Example |
|--------|-------------|---------|
| `insert(vector, metadata=None)` | Insert single vector | `db.insert([1.0, 2.0])` |
| `insert_batch(vectors, metadata=None)` | Insert multiple vectors | `db.insert_batch([[1,2], [3,4]])` |
| `search(query, k=1, ef=None, return_metadata=False)` | Find k nearest neighbors | `db.search([1,2], k=5)` |
| `save(filepath)` | Save to JSON file | `db.save("db.json")` |
| `load(filepath)` | Load from JSON file (class method) | `db = VectorDB.load("db.json")` |
| `to_json()` | Serialize to JSON string | `json_str = db.to_json()` |
| `from_json(json_str)` | Deserialize from JSON (class method) | `db = VectorDB.from_json(s)` |
| `size()` | Get number of vectors | `n = db.size()` |
| `get_metadata(index)` | Get metadata for vector | `meta = db.get_metadata(0)` |
| `update_metadata(index, metadata)` | Update metadata | `db.update_metadata(0, {})` |

### Properties

- `len(db)` - Get number of vectors
- `repr(db)` - String representation

## Common Patterns

### With NumPy
```python
import numpy as np

vectors = np.random.rand(100, 128)
db.insert_batch(vectors.tolist())

query = np.random.rand(128)
results = db.search(query, k=5)
```

### With Metadata
```python
db.insert([1, 2, 3], metadata={"id": "doc1", "type": "text"})
results = db.search([1, 2, 3], k=5, return_metadata=True)

for distance, idx, meta in results:
    print(f"ID: {meta['id']}, Distance: {distance}")
```

### Batch Operations
```python
vectors = [[1,2], [3,4], [5,6]]
metadata = [{"id": i} for i in range(3)]
indices = db.insert_batch(vectors, metadata)
```

### Persistence
```python
# Save
db.save("vectors.json")

# Load later
db = VectorDB.load("vectors.json")

# Or use JSON strings
json_str = db.to_json()
db = VectorDB.from_json(json_str)
```

## Parameters Tuning

### Construction Parameters

- **L (layers)**: More layers for larger datasets (default: 5)
- **mL**: Layer assignment multiplier (default: 0.62, rarely needs changing)
- **efc**: Higher values = better quality, slower construction (default: 10)
- **max_connections**: More connections = better recall, more memory (default: 16)

### Search Parameters

- **k**: Number of results to return
- **ef**: Higher values = better recall, slower search (default: max(k, efc))

### Recommendations

| Dataset Size | L | efc | max_connections | search ef |
|--------------|---|-----|-----------------|-----------|
| < 1K | 3-4 | 10 | 8-16 | 10-20 |
| 1K - 10K | 5 | 20 | 16 | 20-50 |
| 10K - 100K | 5-6 | 30-50 | 16-32 | 50-100 |
| > 100K | 6-8 | 50-100 | 32 | 100-200 |

## Examples

See [example.py](example.py) for comprehensive examples including:
- Basic usage
- NumPy integration
- Persistence
- Metadata management
- Batch operations

## Tests

Run tests:
```bash
pytest
pytest --cov=simple_vectordb --cov-report=html
```

## Performance Tips

1. Use `insert_batch()` for multiple vectors
2. Increase `efc` for better index quality
3. Increase `ef` in search for better recall
4. Use NumPy arrays when possible (converted internally)
5. Save/load from disk to avoid rebuilding
