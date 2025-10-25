"""
Demonstration script using the new VectorDB wrapper class
"""

import sys
import time

# Try to import from the installed package
try:
    from simple_vectordb import VectorDB
except ImportError:
    print("Warning: simple_vectordb package not installed. Falling back to build directory.")
    try:
        sys.path.insert(0, './build')
        from SimpleHNSW import SimpleHNSWIndex
        print("Using C++ bindings directly from build directory.")
        print("For better experience, install the package:")
        print("  cd packages/simple-vectordb-python && pip install -e .")
        sys.exit(1)
    except ImportError:
        print("Error: Could not find SimpleHNSW module.")
        print("Please build the C++ extension first:")
        print("  mkdir -p build && cd build")
        print("  cmake -DPYTHON_BINDINGS=ON .. && make")
        sys.exit(1)

# Optional: Use sentence transformers for embeddings
try:
    from sentence_transformers import SentenceTransformer
    from sentence_transformers.util import cos_sim
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    print("Note: sentence-transformers not installed. Skipping embedding example.")
    print("Install with: pip install sentence-transformers")
    HAS_SENTENCE_TRANSFORMERS = False


def basic_example():
    """Basic usage of VectorDB"""
    print("=== Basic VectorDB Example ===\n")
    
    # Create a VectorDB instance
    db = VectorDB(L=5, mL=0.62, efc=10, max_connections=16)
    
    # Insert some vectors with metadata
    vectors = [
        ([1.0, 2.0, 3.0], {"id": "vec1", "label": "first"}),
        ([1.0, 2.0, 3.1], {"id": "vec2", "label": "second"}),
        ([1.1, 2.1, 3.0], {"id": "vec3", "label": "third"}),
        ([1.1, 2.1, 3.1], {"id": "vec4", "label": "fourth"}),
    ]
    
    print(f"Inserting {len(vectors)} vectors...")
    for vec, meta in vectors:
        idx = db.insert(vec, metadata=meta)
        print(f"  Inserted vector at index {idx}: {meta}")
    
    print(f"\nDatabase size: {db.size()}")
    print(f"Database info: {db}")
    
    # Search for nearest neighbors
    query = [1.0, 2.0, 3.0]
    print(f"\nSearching for top 3 nearest neighbors to {query}:")
    
    start_time = time.time()
    results = db.search(query, k=3, return_metadata=True)
    elapsed = time.time() - start_time
    
    for distance, idx, metadata in results:
        print(f"  Distance: {distance:.6f}, Index: {idx}, Metadata: {metadata}")
    
    print(f"Search completed in {elapsed*1000:.3f} ms\n")


def sentence_embedding_example():
    """Example using sentence transformers for semantic search"""
    if not HAS_SENTENCE_TRANSFORMERS:
        return
    
    print("=== Sentence Embedding Example ===\n")
    
    sentences = [
        "How do I get a replacement Medicare card?",
        "What is the monthly premium for Medicare Part B?",
        "How do I terminate my Medicare Part B (medical insurance)?",
        "How do I sign up for Medicare?",
        "Can I sign up for Medicare Part B if I am working and have health insurance through an employer?",
        "How do I sign up for Medicare Part B if I already have Part A?",
        "What are Medicare late enrollment penalties?",
        "What is Medicare and who can get it?",
        "How can I get help with my Medicare Part A and Part B premiums?",
        "What are the different parts of Medicare?",
        "Will my Medicare premiums be higher because of my higher income?",
        "What is TRICARE?",
        "Should I sign up for Medicare Part B if I have Veterans' Benefits?"
    ]
    
    print(f"Loading sentence transformer model...")
    model = SentenceTransformer('thenlper/gte-small')
    
    print(f"Encoding {len(sentences)} sentences...")
    embeddings = model.encode(sentences)
    print(f"Generated embeddings with shape: {embeddings.shape}")
    print(f"First embedding sample: {embeddings[0][:5]}... (showing first 5 dims)")
    
    # Create database with appropriate parameters for this size
    db = VectorDB(L=5, mL=0.62, efc=20, max_connections=16)
    
    # Insert all embeddings with metadata
    print(f"\nInserting embeddings into database...")
    for i, (embedding, sentence) in enumerate(zip(embeddings, sentences)):
        db.insert(
            embedding.tolist(),
            metadata={"index": i, "text": sentence}
        )
    
    print(f"Database contains {db.size()} vectors")
    
    # Test query
    query_text = "impact of higher income on medicare"
    print(f"\nQuery: '{query_text}'")
    query_embedding = model.encode(query_text)
    
    # Compare with cosine similarity (for reference)
    cos_similarities = [cos_sim(query_embedding, emb).item() for emb in embeddings]
    top_cos_idx = sorted(range(len(cos_similarities)), key=lambda i: cos_similarities[i], reverse=True)[:3]
    
    print("\nTop 3 by cosine similarity (reference):")
    for i, idx in enumerate(top_cos_idx[:3], 1):
        print(f"  {i}. [{idx}] (sim: {cos_similarities[idx]:.4f}) {sentences[idx]}")
    
    # Search using VectorDB
    print("\nTop 3 by HNSW search:")
    start_time = time.time()
    results = db.search(query_embedding, k=3, ef=50, return_metadata=True)
    elapsed = time.time() - start_time
    
    for i, (distance, idx, metadata) in enumerate(results, 1):
        print(f"  {i}. [{idx}] (dist: {distance:.4f}) {metadata['text']}")
    
    print(f"\nSearch completed in {elapsed*1000:.3f} ms")
    
    # Test save and load
    print("\nTesting persistence...")
    filepath = "embeddings_db.json"
    db.save(filepath)
    print(f"Saved database to {filepath}")
    
    loaded_db = VectorDB.load(filepath)
    print(f"Loaded database with {loaded_db.size()} vectors")
    
    # Verify loaded database works
    results_loaded = loaded_db.search(query_embedding, k=3, ef=50, return_metadata=True)
    print("\nVerifying loaded database (top 3):")
    for i, (distance, idx, metadata) in enumerate(results_loaded, 1):
        print(f"  {i}. [{idx}] (dist: {distance:.4f}) {metadata['text'][:50]}...")
    
    print()


if __name__ == "__main__":
    basic_example()
    sentence_embedding_example()
    
    print("=== All examples completed successfully ===")
