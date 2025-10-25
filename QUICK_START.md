# Quick Start Guide - SimpleVectorDB Packages

## Installation

### React
```bash
npm install @simple-vectordb/react @simple-vectordb/wasm
```

### Angular
```bash
npm install @simple-vectordb/angular @simple-vectordb/wasm
```

### Vanilla JavaScript
```bash
npm install @simple-vectordb/wasm
```

---

## React Cheat Sheet

### Basic Setup
```jsx
import { VectorDBProvider, useVectorDB } from '@simple-vectordb/react';

function App() {
  return (
    <VectorDBProvider>
      <YourComponent />
    </VectorDBProvider>
  );
}

function YourComponent() {
  const { db, insert, search, save, load, isReady } = useVectorDB();
  
  // Use db, insert, search, save, load
}
```

### Insert Vectors
```jsx
const { insert } = useVectorDB();

// Insert single vector
insert([1.0, 2.0, 3.0]);

// Insert multiple (in a loop or batch)
vectors.forEach(v => insert(v));
```

### Search
```jsx
const { search } = useVectorDB();

// Search for 5 nearest neighbors
const results = search([1.1, 2.1, 3.1], 5);

// results = [{ distance: 0.1, nodeIndex: 0 }, ...]
```

### Persistence
```jsx
const { save, load } = useVectorDB();

// Save to localStorage
const json = save();
localStorage.setItem('db', json);

// Load from localStorage
const json = localStorage.getItem('db');
await load(json);
```

### Search with State
```jsx
import { useVectorDB, useVectorSearch } from '@simple-vectordb/react';

function SearchComponent() {
  const { db } = useVectorDB();
  const { results, isSearching, search, error } = useVectorSearch(db);
  
  return (
    <div>
      <button onClick={() => search([1,2,3], 5)} disabled={isSearching}>
        Search
      </button>
      {results.map(r => <div key={r.nodeIndex}>{r.distance}</div>)}
    </div>
  );
}
```

---

## Angular Cheat Sheet

### Module Setup
```typescript
import { NgModule } from '@angular/core';
import { VectorDBModule } from '@simple-vectordb/angular';

@NgModule({
  imports: [VectorDBModule]
})
export class AppModule { }
```

### Component Setup
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VectorDBService } from '@simple-vectordb/angular';

@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  constructor(private vectorDB: VectorDBService) {}
  
  async ngOnInit() {
    await this.vectorDB.createDatabase(5, 0.62, 10);
  }
  
  ngOnDestroy() {
    this.vectorDB.destroy();
  }
}
```

### Insert Vectors
```typescript
// Single insert
this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe(
  () => console.log('Inserted')
);

// Multiple inserts
import { forkJoin } from 'rxjs';

const vectors = [[1,2,3], [4,5,6], [7,8,9]];
forkJoin(vectors.map(v => this.vectorDB.insert(v))).subscribe(
  () => console.log('All inserted')
);
```

### Search
```typescript
this.vectorDB.search([1.1, 2.1, 3.1], 5).subscribe(
  results => {
    console.log(results);
    // results = [{ distance: 0.1, nodeIndex: 0 }, ...]
  }
);
```

### Persistence
```typescript
// Save
this.vectorDB.save().subscribe(
  json => localStorage.setItem('db', json)
);

// Load
const json = localStorage.getItem('db');
this.vectorDB.load(json).subscribe(
  () => console.log('Loaded')
);
```

### With async/await
```typescript
async performOperations() {
  await this.vectorDB.createDatabase();
  
  await this.vectorDB.insert([1,2,3]).toPromise();
  
  const results = await this.vectorDB.search([1,2,3], 5).toPromise();
  console.log(results);
}
```

---

## Vanilla JavaScript Cheat Sheet

### Basic Setup
```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

// Initialize WASM (do this once)
await initializeWasm();

// Create database
const db = new SimpleVectorDB(5, 0.62, 10);
```

### Operations
```javascript
// Insert
db.insert([1.0, 2.0, 3.0]);

// Search
const results = db.search([1.1, 2.1, 3.1], 5);

// Save
const json = db.toJSON();

// Load
const db2 = await SimpleVectorDB.fromJSON(json);

// Cleanup
db.delete();
```

---

## TypeScript Types

### React
```typescript
import type { 
  UseSimpleVectorDBResult,
  UseVectorDBResult,
  UseVectorSearchResult 
} from '@simple-vectordb/react';
```

### Angular
```typescript
import type { SearchResult } from '@simple-vectordb/angular';
```

### WASM
```typescript
import type { 
  SearchResult,
  SimpleHNSWIndex,
  SimpleVectorDBModule 
} from '@simple-vectordb/wasm';
```

---

## Common Patterns

### Load on Mount, Save on Unmount (React)
```jsx
function MyComponent() {
  const { load, save, isReady } = useVectorDB();
  
  useEffect(() => {
    const json = localStorage.getItem('db');
    if (json) load(json);
    
    return () => {
      const json = save();
      localStorage.setItem('db', json);
    };
  }, [isReady]);
}
```

### Load on Init, Save on Destroy (Angular)
```typescript
@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  async ngOnInit() {
    await this.vectorDB.createDatabase();
    const json = localStorage.getItem('db');
    if (json) {
      await this.vectorDB.load(json).toPromise();
    }
  }
  
  ngOnDestroy() {
    this.vectorDB.save().subscribe(
      json => localStorage.setItem('db', json)
    );
    this.vectorDB.destroy();
  }
}
```

### Search with Debounce (React)
```jsx
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';

function SearchComponent() {
  const { search } = useVectorDB();
  
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      const results = search(query, 5);
      setResults(results);
    }, 300),
    [search]
  );
  
  return <input onChange={e => debouncedSearch(parseQuery(e.target.value))} />;
}
```

---

## Configuration Reference

```javascript
new SimpleVectorDB(L, mL, efc)
```

- **L** (default: 5): Number of layers in HNSW graph
  - Higher = Better recall, more memory
  - Typical range: 3-10

- **mL** (default: 0.62): Layer assignment multiplier
  - Controls layer distribution
  - Usually keep at 0.62

- **efc** (default: 10): Construction search breadth
  - Higher = Better quality, slower build
  - Typical range: 5-50

---

## Error Handling

### React
```jsx
try {
  insert(vector);
  const results = search(query, k);
} catch (error) {
  console.error('Operation failed:', error);
}
```

### Angular
```typescript
this.vectorDB.search(query, k).subscribe({
  next: results => this.results = results,
  error: error => console.error('Search failed:', error)
});
```

---

## Performance Tips

1. **Batch inserts**: Insert all vectors before searching
2. **Appropriate k**: Don't request more results than needed
3. **Memory**: Call `delete()` when done with databases
4. **Persistence**: Use binary formats for large databases (future)
5. **Dimensions**: Keep vector dimensions consistent

---

## Debugging

### Check if WASM is loaded
```javascript
// React
const { isReady } = useSimpleVectorDB();
console.log('Ready:', isReady);

// Angular
this.vectorDB.isInitialized$.subscribe(ready => 
  console.log('Ready:', ready)
);
```

### Inspect database
```javascript
const json = db.toJSON();
console.log('Database:', JSON.parse(json));
```

### Monitor memory
```javascript
console.log('Heap:', performance.memory?.usedJSHeapSize);
```
