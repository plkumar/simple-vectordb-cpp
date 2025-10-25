# @simple-vectordb/react

React hooks and components for SimpleVectorDB - A fast HNSW-based vector database.

## Installation

```bash
npm install @simple-vectordb/react @simple-vectordb/wasm
```

## Usage

### With Provider (Recommended)

```jsx
import { VectorDBProvider } from '@simple-vectordb/react';
import { MyComponent } from './MyComponent';

function App() {
  return (
    <VectorDBProvider>
      <MyComponent />
    </VectorDBProvider>
  );
}
```

### useVectorDB Hook

```jsx
import { useVectorDB } from '@simple-vectordb/react';

function VectorSearchComponent() {
  const { db, insert, search, save, load, isReady } = useVectorDB(5, 0.62, 10);

  const handleInsert = () => {
    insert([1.0, 2.0, 3.0]);
  };

  const handleSearch = () => {
    const results = search([1.1, 2.1, 3.1], 5);
    console.log(results);
  };

  const handleSave = () => {
    const json = save();
    localStorage.setItem('vectordb', json);
  };

  const handleLoad = async () => {
    const json = localStorage.getItem('vectordb');
    if (json) {
      await load(json);
    }
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button onClick={handleInsert}>Insert Vector</button>
      <button onClick={handleSearch}>Search</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Load</button>
    </div>
  );
}
```

### useVectorSearch Hook

```jsx
import { useVectorDB, useVectorSearch } from '@simple-vectordb/react';

function SearchComponent() {
  const { db, insert, isReady } = useVectorDB();
  const { results, isSearching, search, error } = useVectorSearch(db);

  const handleSearch = async () => {
    await search([1.1, 2.1, 3.1], 5);
  };

  if (!isReady) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      {error && <div>Error: {error.message}</div>}

      <ul>
        {results.map((result, index) => (
          <li key={index}>
            Distance: {result.distance}, Index: {result.nodeIndex}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useSimpleVectorDB Hook

Basic initialization hook:

```jsx
import { useSimpleVectorDB, SimpleVectorDB } from '@simple-vectordb/react';

function MyComponent() {
  const { isLoading, error, isReady } = useSimpleVectorDB();

  if (isLoading) return <div>Loading WASM module...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Use SimpleVectorDB directly when ready
  const db = new SimpleVectorDB();
  // ...
}
```

## API Reference

### Hooks

#### `useSimpleVectorDB()`

Returns:
- `isLoading` (boolean): Whether the WASM module is loading
- `error` (Error | null): Any initialization error
- `isReady` (boolean): Whether the module is ready to use

#### `useVectorDB(L?, mL?, efc?)`

Creates and manages a vector database instance.

Parameters:
- `L` (number, default: 5): Number of layers
- `mL` (number, default: 0.62): Layer multiplier
- `efc` (number, default: 10): Construction parameter

Returns:
- `db` (SimpleVectorDB | null): The database instance
- `insert` (Function): Insert a vector
- `search` (Function): Search for nearest neighbors
- `save` (Function): Save to JSON
- `load` (Function): Load from JSON
- `isReady` (boolean): Whether the database is ready

#### `useVectorSearch(db)`

Manages search state for a database instance.

Parameters:
- `db` (SimpleVectorDB | null): Database instance

Returns:
- `results` (SearchResult[]): Search results
- `isSearching` (boolean): Whether a search is in progress
- `search` (Function): Perform a search
- `error` (Error | null): Any search error

### Components

#### `VectorDBProvider`

Provider component that initializes the WASM module for all child components.

```jsx
<VectorDBProvider>
  {/* Your components */}
</VectorDBProvider>
```

## TypeScript Support

Full TypeScript definitions are included. Import types like:

```typescript
import type { SearchResult } from '@simple-vectordb/react';
```

## License

MIT
