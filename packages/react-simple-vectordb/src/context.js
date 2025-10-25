import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeWasm, getWasmModule } from '@simple-vectordb/wasm';

const VectorDBContext = createContext(null);

/**
 * Provider component for SimpleVectorDB
 */
export function VectorDBProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [module, setModule] = useState(null);

  useEffect(() => {
    let mounted = true;

    initializeWasm()
      .then(() => {
        if (mounted) {
          const wasmModule = getWasmModule();
          setModule(wasmModule);
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

  return (
    <VectorDBContext.Provider value={{ module, isLoading, error }}>
      {children}
    </VectorDBContext.Provider>
  );
}

/**
 * Hook to access the VectorDB context
 */
export function useVectorDBContext() {
  const context = useContext(VectorDBContext);
  if (!context) {
    throw new Error('useVectorDBContext must be used within VectorDBProvider');
  }
  return context;
}
