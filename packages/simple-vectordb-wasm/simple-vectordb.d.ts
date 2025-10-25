/**
 * SimpleVectorDB WASM Module Type Definitions
 */

export interface SearchResult {
  distance: number;
  nodeIndex: number;
}

export interface SimpleHNSWIndex {
  /**
   * Insert a vector into the index
   * @param vector - Array of numbers representing the vector
   */
  insert(vector: number[]): void;

  /**
   * Search for k nearest neighbors
   * @param query - Query vector as array of numbers
   * @param k - Number of results to return (default: 5)
   * @returns Array of search results with distance and node index
   */
  search(query: number[], k?: number): SearchResult[];

  /**
   * Serialize the index to JSON string
   * @returns JSON string representation of the index
   */
  toJSON(): string;

  /**
   * Delete the index and free memory
   */
  delete(): void;
}

export interface SimpleHNSWIndexConstructor {
  /**
   * Create a new SimpleHNSWIndex
   * @param L - Number of layers (default: 5)
   * @param mL - Layer multiplier (default: 0.62)
   * @param efc - Construction parameter (default: 10)
   */
  new(L?: number, mL?: number, efc?: number): SimpleHNSWIndex;

  /**
   * Load an index from JSON string
   * @param json - JSON string representation of an index
   * @returns New SimpleHNSWIndex instance
   */
  fromJSON(json: string): SimpleHNSWIndex;
}

export interface SimpleVectorDBModule {
  SimpleHNSWIndex: SimpleHNSWIndexConstructor;
}

/**
 * Factory function to create the WASM module
 */
export default function createSimpleVectorDB(): Promise<SimpleVectorDBModule>;
