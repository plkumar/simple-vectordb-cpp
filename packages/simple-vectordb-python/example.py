"""
Example usage of SimpleVectorDB
"""

from simple_vectordb import VectorDB
import numpy as np

def basic_example():
    """Basic usage example"""
    print("=== Basic Example ===")
    
    # Create a new database
    db = VectorDB(L=5, mL=0.62, efc=10, max_connections=16)
    
    # Insert some vectors
    db.insert([1.0, 2.0, 3.0], metadata={"id": "vec1", "label": "first"})
    db.insert([1.1, 2.1, 3.1], metadata={"id": "vec2", "label": "second"})
    db.insert([2.0, 3.0, 4.0], metadata={"id": "vec3", "label": "third"})
    db.insert([5.0, 6.0, 7.0], metadata={"id": "vec4", "label": "fourth"})
    
    print(f"Database size: {db.size()}")
    
    # Search for nearest neighbors
    query = [1.0, 2.0, 3.0]
    results = db.search(query, k=3, return_metadata=True)
    
    print(f"\nNearest neighbors to {query}:")
    for distance, idx, metadata in results:
        print(f"  Distance: {distance:.4f}, Index: {idx}, Metadata: {metadata}")


def numpy_example():
    """Example using NumPy arrays"""
    print("\n=== NumPy Example ===")
    
    db = VectorDB()
    
    # Generate random vectors
    vectors = np.random.rand(50, 128)
    print(f"Generated {len(vectors)} random 128-dimensional vectors")
    
    # Insert all vectors
    indices = db.insert_batch(vectors.tolist())
    print(f"Inserted vectors with indices: {indices[:5]}... (showing first 5)")
    
    # Search with a random query
    query = np.random.rand(128)
    results = db.search(query, k=5)
    
    print(f"\nTop 5 nearest neighbors:")
    for distance, idx in results:
        print(f"  Distance: {distance:.4f}, Index: {idx}")


def persistence_example():
    """Example of saving and loading"""
    print("\n=== Persistence Example ===")
    
    # Create and populate database
    db = VectorDB()
    for i in range(10):
        db.insert(
            [float(i), float(i*2), float(i*3)],
            metadata={"number": i, "squared": i*i}
        )
    
    print(f"Created database with {db.size()} vectors")
    
    # Save to file
    filepath = "example_db.json"
    db.save(filepath)
    print(f"Saved database to {filepath}")
    
    # Load from file
    loaded_db = VectorDB.load(filepath)
    print(f"Loaded database with {loaded_db.size()} vectors")
    
    # Verify it works
    results = loaded_db.search([5.0, 10.0, 15.0], k=3, return_metadata=True)
    print("\nSearch results from loaded database:")
    for distance, idx, metadata in results:
        print(f"  Distance: {distance:.4f}, Metadata: {metadata}")


def metadata_example():
    """Example of working with metadata"""
    print("\n=== Metadata Example ===")
    
    db = VectorDB()
    
    # Insert vectors with rich metadata
    db.insert(
        [1.0, 0.0, 0.0],
        metadata={"type": "red", "intensity": 1.0, "tags": ["primary", "warm"]}
    )
    db.insert(
        [0.0, 1.0, 0.0],
        metadata={"type": "green", "intensity": 1.0, "tags": ["primary", "cool"]}
    )
    db.insert(
        [0.0, 0.0, 1.0],
        metadata={"type": "blue", "intensity": 1.0, "tags": ["primary", "cool"]}
    )
    db.insert(
        [1.0, 1.0, 0.0],
        metadata={"type": "yellow", "intensity": 0.8, "tags": ["secondary", "warm"]}
    )
    
    # Search for similar colors
    query = [0.9, 0.1, 0.1]  # Reddish
    results = db.search(query, k=2, return_metadata=True)
    
    print(f"Colors similar to reddish {query}:")
    for distance, idx, metadata in results:
        print(f"  {metadata['type']}: distance={distance:.4f}, tags={metadata['tags']}")
    
    # Update metadata
    db.update_metadata(0, {"type": "red", "intensity": 0.9, "tags": ["primary", "warm"], "updated": True})
    print(f"\nUpdated metadata for index 0: {db.get_metadata(0)}")


def batch_operations_example():
    """Example of batch operations"""
    print("\n=== Batch Operations Example ===")
    
    db = VectorDB(efc=20)  # Higher efc for better quality with more vectors
    
    # Create a batch of vectors
    num_vectors = 100
    dim = 64
    vectors = np.random.rand(num_vectors, dim).tolist()
    
    # Create metadata for each vector
    metadata_list = [
        {"batch": i // 10, "index": i, "value": i * 2}
        for i in range(num_vectors)
    ]
    
    # Insert all at once
    indices = db.insert_batch(vectors, metadata_list)
    print(f"Inserted {len(indices)} vectors in batch")
    
    # Search
    query = np.random.rand(dim).tolist()
    results = db.search(query, k=5, ef=50, return_metadata=True)
    
    print("\nTop 5 results:")
    for distance, idx, metadata in results:
        print(f"  Index: {idx}, Batch: {metadata['batch']}, Distance: {distance:.4f}")


if __name__ == "__main__":
    basic_example()
    numpy_example()
    persistence_example()
    metadata_example()
    batch_operations_example()
    
    print("\n=== All examples completed ===")
