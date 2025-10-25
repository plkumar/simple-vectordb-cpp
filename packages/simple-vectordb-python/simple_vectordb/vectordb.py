"""
High-level Python wrapper for SimpleHNSW C++ implementation
"""

import json
from typing import List, Tuple, Optional, Union, Any, Dict
import numpy as np

try:
    from SimpleHNSW import SimpleHNSWIndex
except ImportError:
    raise ImportError(
        "SimpleHNSW module not found. Please build the C++ bindings first using: "
        "cmake -DPYTHON_BINDINGS=ON .. && make"
    )


class VectorDB:
    """
    A simple vector database with HNSW (Hierarchical Navigable Small World) indexing.
    
    This class provides a Pythonic interface to the SimpleHNSW C++ implementation,
    offering efficient approximate nearest neighbor search.
    
    Attributes:
        L (int): Number of layers in the hierarchical graph
        mL (float): Normalization factor for layer assignment
        efc (int): Size of the dynamic candidate list during construction
        max_connections (int): Maximum number of connections per node
    
    Example:
        >>> db = VectorDB(L=5, mL=0.62, efc=10, max_connections=16)
        >>> db.insert([1.0, 2.0, 3.0])
        >>> db.insert([1.1, 2.1, 3.1])
        >>> results = db.search([1.0, 2.0, 3.0], k=2)
        >>> print(results)
        [(0.0, 0), (0.17320508075688773, 1)]
    """
    
    def __init__(
        self,
        L: int = 5,
        mL: float = 0.62,
        efc: int = 10,
        max_connections: int = 16
    ):
        """
        Initialize a VectorDB instance.
        
        Args:
            L: Number of layers in the hierarchical graph (default: 5)
            mL: Normalization factor for layer assignment (default: 0.62)
            efc: Size of the dynamic candidate list during construction (default: 10)
            max_connections: Maximum number of connections per node (default: 16)
        """
        self._index = SimpleHNSWIndex(L, mL, efc, max_connections)
        self.L = L
        self.mL = mL
        self.efc = efc
        self.max_connections = max_connections
        self._vector_count = 0
        self._metadata: List[Optional[Dict[str, Any]]] = []
    
    def insert(
        self,
        vector: Union[List[float], np.ndarray],
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Insert a vector into the database.
        
        Args:
            vector: The vector to insert (list or numpy array)
            metadata: Optional metadata to associate with the vector
        
        Returns:
            The index of the inserted vector
        
        Raises:
            ValueError: If the vector is empty or invalid
        """
        if isinstance(vector, np.ndarray):
            vector = vector.tolist()
        
        if not vector or not isinstance(vector, list):
            raise ValueError("Vector must be a non-empty list or numpy array")
        
        self._index.insert(vector)
        self._metadata.append(metadata)
        vector_id = self._vector_count
        self._vector_count += 1
        return vector_id
    
    def insert_batch(
        self,
        vectors: Union[List[List[float]], np.ndarray],
        metadata: Optional[List[Optional[Dict[str, Any]]]] = None
    ) -> List[int]:
        """
        Insert multiple vectors into the database.
        
        Args:
            vectors: List of vectors or 2D numpy array
            metadata: Optional list of metadata dictionaries for each vector
        
        Returns:
            List of indices for the inserted vectors
        
        Raises:
            ValueError: If vectors is empty or metadata length doesn't match
        """
        if isinstance(vectors, np.ndarray):
            vectors = vectors.tolist()
        
        if not vectors:
            raise ValueError("Vectors list cannot be empty")
        
        if metadata is not None and len(metadata) != len(vectors):
            raise ValueError("Metadata list length must match vectors list length")
        
        indices = []
        for i, vector in enumerate(vectors):
            meta = metadata[i] if metadata else None
            idx = self.insert(vector, meta)
            indices.append(idx)
        
        return indices
    
    def search(
        self,
        query: Union[List[float], np.ndarray],
        k: int = 1,
        ef: Optional[int] = None,
        return_metadata: bool = False
    ) -> Union[List[Tuple[float, int]], List[Tuple[float, int, Optional[Dict[str, Any]]]]]:
        """
        Search for the k nearest neighbors of a query vector.
        
        Args:
            query: The query vector (list or numpy array)
            k: Number of nearest neighbors to return (default: 1)
            ef: Size of the dynamic candidate list during search (default: k)
            return_metadata: If True, include metadata in results (default: False)
        
        Returns:
            List of tuples containing (distance, index) or (distance, index, metadata)
            if return_metadata is True
        
        Raises:
            ValueError: If query is empty or k is invalid
        """
        if isinstance(query, np.ndarray):
            query = query.tolist()
        
        if not query or not isinstance(query, list):
            raise ValueError("Query must be a non-empty list or numpy array")
        
        if k < 1:
            raise ValueError("k must be at least 1")
        
        if ef is None:
            ef = max(k, self.efc)
        
        results = self._index.search(query, ef)
        
        # Limit to k results
        results = results[:k]
        
        if return_metadata:
            return [
                (distance, idx, self._metadata[idx] if idx < len(self._metadata) else None)
                for distance, idx in results
            ]
        
        return results
    
    def size(self) -> int:
        """
        Get the number of vectors in the database.
        
        Returns:
            Number of vectors stored
        """
        return self._vector_count
    
    def get_metadata(self, index: int) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a vector at a specific index.
        
        Args:
            index: The index of the vector
        
        Returns:
            Metadata dictionary or None if no metadata exists
        
        Raises:
            IndexError: If index is out of bounds
        """
        if index < 0 or index >= self._vector_count:
            raise IndexError(f"Index {index} out of bounds [0, {self._vector_count})")
        
        if index < len(self._metadata):
            return self._metadata[index]
        return None
    
    def update_metadata(self, index: int, metadata: Dict[str, Any]) -> None:
        """
        Update metadata for a vector at a specific index.
        
        Args:
            index: The index of the vector
            metadata: New metadata dictionary
        
        Raises:
            IndexError: If index is out of bounds
        """
        if index < 0 or index >= self._vector_count:
            raise IndexError(f"Index {index} out of bounds [0, {self._vector_count})")
        
        # Ensure metadata list is large enough
        while len(self._metadata) <= index:
            self._metadata.append(None)
        
        self._metadata[index] = metadata
    
    def save(self, filepath: str) -> None:
        """
        Save the database to a JSON file.
        
        Args:
            filepath: Path to save the database
        """
        index_json = self._index.toJSON()
        index_data = json.loads(index_json)
        
        data = {
            "index": index_data,
            "vector_count": self._vector_count,
            "metadata": self._metadata,
            "config": {
                "L": self.L,
                "mL": self.mL,
                "efc": self.efc,
                "max_connections": self.max_connections
            }
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f)
    
    @classmethod
    def load(cls, filepath: str) -> "VectorDB":
        """
        Load a database from a JSON file.
        
        Args:
            filepath: Path to the saved database
        
        Returns:
            VectorDB instance loaded from file
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        config = data.get("config", {})
        db = cls(
            L=config.get("L", 5),
            mL=config.get("mL", 0.62),
            efc=config.get("efc", 10),
            max_connections=config.get("max_connections", 16)
        )
        
        # Load the C++ index
        index_json = json.dumps(data["index"])
        db._index = SimpleHNSWIndex.fromJSON(index_json)
        
        # Load metadata
        db._vector_count = data.get("vector_count", 0)
        db._metadata = data.get("metadata", [])
        
        return db
    
    def to_json(self) -> str:
        """
        Serialize the database to a JSON string.
        
        Returns:
            JSON string representation of the database
        """
        index_json = self._index.toJSON()
        index_data = json.loads(index_json)
        
        data = {
            "index": index_data,
            "vector_count": self._vector_count,
            "metadata": self._metadata,
            "config": {
                "L": self.L,
                "mL": self.mL,
                "efc": self.efc,
                "max_connections": self.max_connections
            }
        }
        
        return json.dumps(data)
    
    @classmethod
    def from_json(cls, json_str: str) -> "VectorDB":
        """
        Deserialize a database from a JSON string.
        
        Args:
            json_str: JSON string representation of the database
        
        Returns:
            VectorDB instance
        """
        data = json.loads(json_str)
        
        config = data.get("config", {})
        db = cls(
            L=config.get("L", 5),
            mL=config.get("mL", 0.62),
            efc=config.get("efc", 10),
            max_connections=config.get("max_connections", 16)
        )
        
        # Load the C++ index
        index_json = json.dumps(data["index"])
        db._index = SimpleHNSWIndex.fromJSON(index_json)
        
        # Load metadata
        db._vector_count = data.get("vector_count", 0)
        db._metadata = data.get("metadata", [])
        
        return db
    
    def __len__(self) -> int:
        """Get the number of vectors in the database."""
        return self._vector_count
    
    def __repr__(self) -> str:
        """String representation of the VectorDB instance."""
        return (
            f"VectorDB(L={self.L}, mL={self.mL}, efc={self.efc}, "
            f"max_connections={self.max_connections}, size={self._vector_count})"
        )
