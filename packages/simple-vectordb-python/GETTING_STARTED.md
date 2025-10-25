# Getting Started with SimpleVectorDB Python

## Installation

### Quick Install

```bash
cd packages/simple-vectordb-python
pip install -e .
```

This will:
1. Install Python dependencies (numpy)
2. Fetch pybind11 and nlohmann_json via CMake
3. Build the C++ extension
4. Install the package in development mode

## Verify Installation

```python
from simple_vectordb import VectorDB

db = VectorDB()
db.insert([1.0, 2.0, 3.0])
results = db.search([1.0, 2.0, 3.0], k=1)
print(f"Success! Results: {results}")
```

## Quick Example

```python
from simple_vectordb import VectorDB
import numpy as np

# Create a database
db = VectorDB(
    L=5,              # Number of layers
    mL=0.62,          # Layer multiplier
    efc=10,           # Construction ef
    max_connections=16 # Max connections per node
)

# Insert vectors with metadata
db.insert([1.0, 2.0, 3.0], metadata={"id": "vec1", "label": "first"})
db.insert([1.1, 2.1, 3.1], metadata={"id": "vec2", "label": "second"})
db.insert([2.0, 3.0, 4.0], metadata={"id": "vec3", "label": "third"})

# Insert batch with NumPy
vectors = np.random.rand(100, 128)
db.insert_batch(vectors.tolist())

# Search with metadata
query = [1.0, 2.0, 3.0]
results = db.search(query, k=5, ef=50, return_metadata=True)

for distance, idx, metadata in results:
    print(f"Distance: {distance:.4f}, Index: {idx}")
    if metadata:
        print(f"  Metadata: {metadata}")

# Save database
db.save("my_database.json")

# Load database
loaded_db = VectorDB.load("my_database.json")
print(f"Loaded database with {loaded_db.size()} vectors")
```

## Running Examples

### Basic Example
```bash
cd packages/simple-vectordb-python
python example.py
```

### Sentence Embeddings Example (requires sentence-transformers)
```bash
pip install sentence-transformers
python ../../test_wrapper.py
```

## Running Tests

```bash
cd packages/simple-vectordb-python

# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest -v

# Run with coverage
pytest --cov=simple_vectordb --cov-report=html
```

## Common Use Cases

### 1. Semantic Search with Embeddings

```python
from simple_vectordb import VectorDB
from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create database
db = VectorDB()

# Documents to index
docs = [
    "Python is a programming language",
    "JavaScript is used for web development",
    "Machine learning uses algorithms to learn from data"
]

# Insert document embeddings
for doc in docs:
    embedding = model.encode(doc)
    db.insert(embedding, metadata={"text": doc})

# Search
query = "What is Python?"
query_emb = model.encode(query)
results = db.search(query_emb, k=3, return_metadata=True)

for dist, idx, meta in results:
    print(f"{meta['text']} (distance: {dist:.4f})")
```

### 2. Image Similarity Search

```python
from simple_vectordb import VectorDB
import numpy as np

# Assume you have image features from a CNN
image_features = np.random.rand(1000, 2048)  # 1000 images, 2048-dim features

db = VectorDB(efc=30, max_connections=32)  # Higher quality for images

# Insert with metadata
for i, features in enumerate(image_features):
    db.insert(
        features,
        metadata={"image_id": i, "path": f"/images/img_{i}.jpg"}
    )

# Find similar images
query_features = np.random.rand(2048)
similar = db.search(query_features, k=10, ef=100)

for dist, idx in similar:
    meta = db.get_metadata(idx)
    print(f"Similar image: {meta['path']} (distance: {dist:.4f})")
```

### 3. User Profile Matching

```python
from simple_vectordb import VectorDB

db = VectorDB()

# User profiles as feature vectors
users = [
    {"id": 1, "features": [0.8, 0.2, 0.9, 0.1], "name": "Alice"},
    {"id": 2, "features": [0.1, 0.9, 0.2, 0.8], "name": "Bob"},
    {"id": 3, "features": [0.7, 0.3, 0.8, 0.2], "name": "Charlie"},
]

for user in users:
    db.insert(
        user["features"],
        metadata={"user_id": user["id"], "name": user["name"]}
    )

# Find similar users
target_user = [0.75, 0.25, 0.85, 0.15]
matches = db.search(target_user, k=3, return_metadata=True)

print("Similar users:")
for dist, idx, meta in matches:
    print(f"  {meta['name']} (similarity score: {1/(1+dist):.2f})")
```

### 4. Recommendation System

```python
from simple_vectordb import VectorDB
import numpy as np

# Item embeddings (products, movies, etc.)
db = VectorDB(L=6, efc=50, max_connections=32)

# Add items
items = [
    {"id": "prod_1", "name": "Laptop", "features": np.random.rand(128)},
    {"id": "prod_2", "name": "Mouse", "features": np.random.rand(128)},
    {"id": "prod_3", "name": "Keyboard", "features": np.random.rand(128)},
]

for item in items:
    db.insert(
        item["features"],
        metadata={
            "item_id": item["id"],
            "name": item["name"]
        }
    )

# Get recommendations based on user's liked item
liked_item_features = items[0]["features"]
recommendations = db.search(
    liked_item_features,
    k=5,
    ef=100,
    return_metadata=True
)

print("Recommended items:")
for dist, idx, meta in recommendations[1:]:  # Skip first (same item)
    print(f"  {meta['name']} - {meta['item_id']}")
```

## Performance Tuning

### For Different Dataset Sizes

```python
# Small dataset (< 1,000 vectors)
db = VectorDB(L=3, efc=10, max_connections=8)

# Medium dataset (1,000 - 10,000 vectors)
db = VectorDB(L=5, efc=20, max_connections=16)

# Large dataset (10,000 - 100,000 vectors)
db = VectorDB(L=6, efc=50, max_connections=32)

# Very large dataset (> 100,000 vectors)
db = VectorDB(L=8, efc=100, max_connections=32)
```

### Search Quality vs Speed

```python
# Fast search (lower recall)
results = db.search(query, k=10, ef=10)

# Balanced search
results = db.search(query, k=10, ef=50)

# High quality search (better recall)
results = db.search(query, k=10, ef=200)
```

## Best Practices

1. **Use batch insertion** for better performance
   ```python
   db.insert_batch(vectors, metadata_list)  # Better
   # vs
   for v, m in zip(vectors, metadata_list):
       db.insert(v, m)  # Slower
   ```

2. **Save databases** to avoid rebuilding
   ```python
   db.save("database.json")
   # Later...
   db = VectorDB.load("database.json")
   ```

3. **Tune ef for your use case**
   - Higher ef = better recall but slower
   - Start with ef = 2 * k and adjust

4. **Use appropriate data types**
   - NumPy arrays are automatically converted
   - Lists work but NumPy is more efficient

5. **Store useful metadata**
   ```python
   db.insert(
       vector,
       metadata={
           "id": "unique_id",
           "timestamp": "2025-01-01",
           "category": "type_a",
           "score": 0.95
       }
   )
   ```

## Troubleshooting

### ImportError: SimpleHNSW module not found
```bash
# Rebuild the C++ extension
cd packages/simple-vectordb-python
pip install --force-reinstall -e .
```

### Low Search Quality
```python
# Increase construction quality
db = VectorDB(efc=50)  # Higher efc

# Increase search quality
results = db.search(query, k=10, ef=100)  # Higher ef
```

### Slow Performance
```python
# Reduce connections
db = VectorDB(max_connections=8)

# Reduce search ef
results = db.search(query, k=10, ef=20)
```

## API Quick Reference

| Method | Purpose |
|--------|---------|
| `VectorDB(...)` | Create database |
| `insert(vec, meta)` | Insert one vector |
| `insert_batch(vecs, metas)` | Insert many vectors |
| `search(query, k, ef)` | Find k nearest |
| `save(path)` | Save to file |
| `load(path)` | Load from file |
| `size()` | Get vector count |
| `get_metadata(idx)` | Get metadata |
| `update_metadata(idx, meta)` | Update metadata |

## Documentation Files

- **README.md** - Complete API documentation
- **INSTALL.md** - Installation and build guide
- **QUICKSTART.md** - Quick reference
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **example.py** - Usage examples
- **test_wrapper.py** - Integration examples

## Support

For issues, questions, or contributions:
1. Check the documentation in the `packages/simple-vectordb-python` folder
2. Run the test suite: `pytest -v`
3. Try the examples: `python example.py`
4. Review the implementation summary for technical details

## Next Steps

1. ✅ Install the package: `pip install -e .`
2. ✅ Run the examples: `python example.py`
3. ✅ Run the tests: `pytest`
4. ✅ Try with your own data
5. ✅ Tune parameters for your use case

Happy vector searching! 🚀
