import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

/**
 * Hook to initialize the WASM module
 * @returns {{ isLoading: boolean, error: Error | null, isReady: boolean }}
 */
export function useSimpleVectorDB() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    initializeWasm()
      .then(() => {
        if (mounted) {
          setIsReady(true);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoading, error, isReady };
}

/**
 * Hook to create and manage a vector database instance
 * @param {number} L - Number of layers (default: 5)
 * @param {number} mL - Layer multiplier (default: 0.62)
 * @param {number} efc - Construction parameter (default: 10)
 * @returns {{ db: SimpleVectorDB | null, insert: Function, search: Function, save: Function, load: Function, isReady: boolean }}
 */
export function useVectorDB(L = 5, mL = 0.62, efc = 10) {
  const { isReady } = useSimpleVectorDB();
  const [db, setDb] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    if (isReady && !dbRef.current) {
      try {
        const instance = new SimpleVectorDB(L, mL, efc);
        dbRef.current = instance;
        setDb(instance);
      } catch (err) {
        console.error('Failed to create VectorDB instance:', err);
      }
    }

    return () => {
      if (dbRef.current) {
        dbRef.current.delete();
        dbRef.current = null;
      }
    };
  }, [isReady, L, mL, efc]);

  const insert = useCallback((vector) => {
    if (!dbRef.current) {
      throw new Error('VectorDB not initialized');
    }
    return dbRef.current.insert(vector);
  }, []);

  const search = useCallback((query, k = 5) => {
    if (!dbRef.current) {
      throw new Error('VectorDB not initialized');
    }
    return dbRef.current.search(query, k);
  }, []);

  const save = useCallback(() => {
    if (!dbRef.current) {
      throw new Error('VectorDB not initialized');
    }
    return dbRef.current.toJSON();
  }, []);

  const load = useCallback(async (json) => {
    if (dbRef.current) {
      dbRef.current.delete();
    }
    const instance = await SimpleVectorDB.fromJSON(json);
    dbRef.current = instance;
    setDb(instance);
  }, []);

  return {
    db,
    insert,
    search,
    save,
    load,
    isReady: isReady && db !== null,
  };
}

/**
 * Hook for performing vector searches with state management
 * @param {SimpleVectorDB | null} db - The vector database instance
 * @returns {{ results: Array, isSearching: boolean, search: Function, error: Error | null }}
 */
export function useVectorSearch(db) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(
    async (query, k = 5) => {
      if (!db) {
        setError(new Error('Database not initialized'));
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = db.search(query, k);
        setResults(searchResults);
      } catch (err) {
        setError(err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [db]
  );

  return { results, isSearching, search, error };
}
