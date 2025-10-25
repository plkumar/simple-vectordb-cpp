import { SimpleVectorDB } from '@simple-vectordb/wasm';

export interface UseSimpleVectorDBResult {
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

export interface UseVectorDBResult {
  db: SimpleVectorDB | null;
  insert: (vector: number[]) => void;
  search: (query: number[], k?: number) => Array<{ distance: number; nodeIndex: number }>;
  save: () => string;
  load: (json: string) => Promise<void>;
  isReady: boolean;
}

export interface UseVectorSearchResult {
  results: Array<{ distance: number; nodeIndex: number }>;
  isSearching: boolean;
  search: (query: number[], k?: number) => Promise<void>;
  error: Error | null;
}

export function useSimpleVectorDB(): UseSimpleVectorDBResult;

export function useVectorDB(
  L?: number,
  mL?: number,
  efc?: number
): UseVectorDBResult;

export function useVectorSearch(
  db: SimpleVectorDB | null
): UseVectorSearchResult;

export { VectorDBProvider, useVectorDBContext } from './context';
export { SimpleVectorDB, initializeWasm } from '@simple-vectordb/wasm';
