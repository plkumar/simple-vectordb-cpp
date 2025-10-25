import { Injectable } from '@angular/core';
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface SearchResult {
  distance: number;
  nodeIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class VectorDBService {
  private isInitialized = new BehaviorSubject<boolean>(false);
  private db: SimpleVectorDB | null = null;
  private initializationPromise: Promise<void> | null = null;

  public isInitialized$: Observable<boolean> = this.isInitialized.asObservable();

  constructor() {}

  /**
   * Initialize the WASM module
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = initializeWasm().then(() => {
      this.isInitialized.next(true);
    });

    return this.initializationPromise;
  }

  /**
   * Create a new vector database instance
   */
  async createDatabase(L = 5, mL = 0.62, efc = 10): Promise<SimpleVectorDB> {
    await this.initialize();
    this.db = new SimpleVectorDB(L, mL, efc);
    return this.db;
  }

  /**
   * Get the current database instance
   */
  getDatabase(): SimpleVectorDB | null {
    return this.db;
  }

  /**
   * Insert a vector into the database
   */
  insert(vector: number[]): Observable<void> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(Promise.resolve(this.db.insert(vector)));
  }

  /**
   * Search for k nearest neighbors
   */
  search(query: number[], k = 5): Observable<SearchResult[]> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(Promise.resolve(this.db.search(query, k)));
  }

  /**
   * Save the database to JSON
   */
  save(): Observable<string> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    return from(Promise.resolve(this.db.toJSON()));
  }

  /**
   * Load a database from JSON
   */
  load(json: string): Observable<void> {
    return from(
      this.initialize().then(() => 
        SimpleVectorDB.fromJSON(json).then((db) => {
          if (this.db) {
            this.db.delete();
          }
          this.db = db;
        })
      )
    );
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.db) {
      this.db.delete();
      this.db = null;
    }
  }
}
