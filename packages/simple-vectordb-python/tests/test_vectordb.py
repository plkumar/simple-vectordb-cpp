"""
Unit tests for SimpleVectorDB
"""

import pytest
import numpy as np
import json
import tempfile
import os
from simple_vectordb import VectorDB


class TestVectorDB:
    """Test suite for VectorDB class"""
    
    def test_initialization(self):
        """Test VectorDB initialization"""
        db = VectorDB()
        assert db.L == 5
        assert db.mL == 0.62
        assert db.efc == 10
        assert db.max_connections == 16
        assert db.size() == 0
        
        db2 = VectorDB(L=3, mL=0.5, efc=20, max_connections=8)
        assert db2.L == 3
        assert db2.mL == 0.5
        assert db2.efc == 20
        assert db2.max_connections == 8
    
    def test_insert_list(self):
        """Test inserting vectors as lists"""
        db = VectorDB()
        
        idx1 = db.insert([1.0, 2.0, 3.0])
        assert idx1 == 0
        assert db.size() == 1
        
        idx2 = db.insert([4.0, 5.0, 6.0])
        assert idx2 == 1
        assert db.size() == 2
    
    def test_insert_numpy(self):
        """Test inserting vectors as NumPy arrays"""
        db = VectorDB()
        
        vec = np.array([1.0, 2.0, 3.0])
        idx = db.insert(vec)
        assert idx == 0
        assert db.size() == 1
    
    def test_insert_with_metadata(self):
        """Test inserting vectors with metadata"""
        db = VectorDB()
        
        metadata = {"id": "vec1", "label": "test"}
        idx = db.insert([1.0, 2.0, 3.0], metadata=metadata)
        
        retrieved_metadata = db.get_metadata(idx)
        assert retrieved_metadata == metadata
    
    def test_insert_invalid_vector(self):
        """Test that inserting invalid vectors raises errors"""
        db = VectorDB()
        
        with pytest.raises(ValueError):
            db.insert([])
        
        with pytest.raises(ValueError):
            db.insert(None)
    
    def test_insert_batch(self):
        """Test batch insertion"""
        db = VectorDB()
        
        vectors = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]
        indices = db.insert_batch(vectors)
        
        assert len(indices) == 3
        assert indices == [0, 1, 2]
        assert db.size() == 3
    
    def test_insert_batch_with_metadata(self):
        """Test batch insertion with metadata"""
        db = VectorDB()
        
        vectors = [[1.0, 2.0], [3.0, 4.0]]
        metadata = [{"id": 1}, {"id": 2}]
        indices = db.insert_batch(vectors, metadata)
        
        assert db.get_metadata(0) == {"id": 1}
        assert db.get_metadata(1) == {"id": 2}
    
    def test_insert_batch_metadata_mismatch(self):
        """Test that mismatched metadata length raises error"""
        db = VectorDB()
        
        vectors = [[1.0, 2.0], [3.0, 4.0]]
        metadata = [{"id": 1}]  # Wrong length
        
        with pytest.raises(ValueError):
            db.insert_batch(vectors, metadata)
    
    def test_search_basic(self):
        """Test basic search functionality"""
        db = VectorDB()
        
        db.insert([1.0, 2.0, 3.0])
        db.insert([1.1, 2.1, 3.1])
        db.insert([5.0, 6.0, 7.0])
        
        results = db.search([1.0, 2.0, 3.0], k=2)
        
        assert len(results) == 2
        assert results[0][1] == 0  # First result should be index 0
        assert results[0][0] < 0.01  # Distance should be very small
    
    def test_search_with_metadata(self):
        """Test search with metadata return"""
        db = VectorDB()
        
        db.insert([1.0, 2.0], metadata={"id": "first"})
        db.insert([3.0, 4.0], metadata={"id": "second"})
        
        results = db.search([1.0, 2.0], k=1, return_metadata=True)
        
        assert len(results) == 1
        distance, idx, metadata = results[0]
        assert metadata == {"id": "first"}
    
    def test_search_numpy(self):
        """Test search with NumPy array"""
        db = VectorDB()
        
        db.insert([1.0, 2.0, 3.0])
        db.insert([4.0, 5.0, 6.0])
        
        query = np.array([1.0, 2.0, 3.0])
        results = db.search(query, k=1)
        
        assert len(results) == 1
        assert results[0][1] == 0
    
    def test_search_invalid_k(self):
        """Test that invalid k raises error"""
        db = VectorDB()
        db.insert([1.0, 2.0, 3.0])
        
        with pytest.raises(ValueError):
            db.search([1.0, 2.0, 3.0], k=0)
        
        with pytest.raises(ValueError):
            db.search([1.0, 2.0, 3.0], k=-1)
    
    def test_search_invalid_query(self):
        """Test that invalid query raises error"""
        db = VectorDB()
        db.insert([1.0, 2.0, 3.0])
        
        with pytest.raises(ValueError):
            db.search([], k=1)
        
        with pytest.raises(ValueError):
            db.search(None, k=1)
    
    def test_metadata_operations(self):
        """Test metadata get and update operations"""
        db = VectorDB()
        
        db.insert([1.0, 2.0], metadata={"value": 1})
        
        # Get metadata
        metadata = db.get_metadata(0)
        assert metadata == {"value": 1}
        
        # Update metadata
        db.update_metadata(0, {"value": 2, "new_field": "test"})
        metadata = db.get_metadata(0)
        assert metadata == {"value": 2, "new_field": "test"}
    
    def test_metadata_out_of_bounds(self):
        """Test that out of bounds metadata access raises error"""
        db = VectorDB()
        db.insert([1.0, 2.0])
        
        with pytest.raises(IndexError):
            db.get_metadata(5)
        
        with pytest.raises(IndexError):
            db.update_metadata(5, {"test": "value"})
    
    def test_save_and_load(self):
        """Test saving and loading database"""
        db = VectorDB()
        
        db.insert([1.0, 2.0, 3.0], metadata={"id": 1})
        db.insert([4.0, 5.0, 6.0], metadata={"id": 2})
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            filepath = f.name
        
        try:
            # Save
            db.save(filepath)
            assert os.path.exists(filepath)
            
            # Load
            loaded_db = VectorDB.load(filepath)
            assert loaded_db.size() == 2
            assert loaded_db.get_metadata(0) == {"id": 1}
            assert loaded_db.get_metadata(1) == {"id": 2}
            
            # Test search on loaded db
            results = loaded_db.search([1.0, 2.0, 3.0], k=1)
            assert results[0][1] == 0
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    
    def test_to_json_from_json(self):
        """Test JSON serialization and deserialization"""
        db = VectorDB()
        
        db.insert([1.0, 2.0], metadata={"test": "value"})
        db.insert([3.0, 4.0])
        
        # Serialize
        json_str = db.to_json()
        assert isinstance(json_str, str)
        
        # Verify it's valid JSON
        data = json.loads(json_str)
        assert "index" in data
        assert "vector_count" in data
        assert "metadata" in data
        
        # Deserialize
        loaded_db = VectorDB.from_json(json_str)
        assert loaded_db.size() == 2
        assert loaded_db.get_metadata(0) == {"test": "value"}
    
    def test_len_and_repr(self):
        """Test __len__ and __repr__ methods"""
        db = VectorDB()
        
        assert len(db) == 0
        
        db.insert([1.0, 2.0])
        db.insert([3.0, 4.0])
        
        assert len(db) == 2
        
        repr_str = repr(db)
        assert "VectorDB" in repr_str
        assert "size=2" in repr_str
    
    def test_large_dataset(self):
        """Test with a larger dataset"""
        db = VectorDB(efc=20)
        
        # Insert 100 random vectors
        np.random.seed(42)
        vectors = np.random.rand(100, 64)
        
        for vec in vectors:
            db.insert(vec.tolist())
        
        assert db.size() == 100
        
        # Search should return results
        query = np.random.rand(64)
        results = db.search(query, k=10, ef=50)
        
        assert len(results) == 10
        # Distances should be in ascending order
        for i in range(len(results) - 1):
            assert results[i][0] <= results[i + 1][0]
