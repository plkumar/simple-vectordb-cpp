# @simple-vectordb/angular

Angular service and module for SimpleVectorDB - A fast HNSW-based vector database.

## Installation

```bash
npm install @simple-vectordb/angular @simple-vectordb/wasm
```

## Setup

### Import the Module

```typescript
import { NgModule } from '@angular/core';
import { VectorDBModule } from '@simple-vectordb/angular';

@NgModule({
  imports: [
    VectorDBModule
  ]
})
export class AppModule { }
```

## Usage

### Basic Example

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VectorDBService } from '@simple-vectordb/angular';

@Component({
  selector: 'app-vector-search',
  template: `
    <div>
      <button (click)="insert()">Insert Vector</button>
      <button (click)="search()">Search</button>
      <button (click)="save()">Save</button>
      <button (click)="load()">Load</button>

      <ul>
        <li *ngFor="let result of results">
          Distance: {{ result.distance }}, Index: {{ result.nodeIndex }}
        </li>
      </ul>
    </div>
  `
})
export class VectorSearchComponent implements OnInit, OnDestroy {
  results: any[] = [];

  constructor(private vectorDB: VectorDBService) {}

  async ngOnInit() {
    await this.vectorDB.createDatabase(5, 0.62, 10);
  }

  insert() {
    this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe(() => {
      console.log('Vector inserted');
    });
  }

  search() {
    this.vectorDB.search([1.1, 2.1, 3.1], 5).subscribe(
      results => {
        this.results = results;
        console.log('Search results:', results);
      },
      error => console.error('Search error:', error)
    );
  }

  save() {
    this.vectorDB.save().subscribe(
      json => {
        localStorage.setItem('vectordb', json);
        console.log('Database saved');
      }
    );
  }

  load() {
    const json = localStorage.getItem('vectordb');
    if (json) {
      this.vectorDB.load(json).subscribe(
        () => console.log('Database loaded'),
        error => console.error('Load error:', error)
      );
    }
  }

  ngOnDestroy() {
    this.vectorDB.destroy();
  }
}
```

### With Observables

```typescript
import { Component, OnInit } from '@angular/core';
import { VectorDBService } from '@simple-vectordb/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-search',
  template: `
    <div *ngIf="isInitialized$ | async">
      <button (click)="performSearch()">Search</button>
      <div *ngFor="let result of searchResults$ | async">
        Distance: {{ result.distance }}
      </div>
    </div>
  `
})
export class SearchComponent implements OnInit {
  isInitialized$: Observable<boolean>;
  searchResults$: Observable<any[]>;

  constructor(private vectorDB: VectorDBService) {
    this.isInitialized$ = vectorDB.isInitialized$;
  }

  async ngOnInit() {
    await this.vectorDB.createDatabase();
    
    // Insert some vectors
    this.vectorDB.insert([1.0, 2.0, 3.0]).subscribe();
    this.vectorDB.insert([1.0, 2.0, 3.1]).subscribe();
  }

  performSearch() {
    this.searchResults$ = this.vectorDB.search([1.1, 2.1, 3.1], 5);
  }
}
```

### Batch Operations

```typescript
import { forkJoin } from 'rxjs';

async insertMultiple() {
  const vectors = [
    [1.0, 2.0, 3.0],
    [1.1, 2.1, 3.1],
    [2.0, 3.0, 4.0]
  ];

  forkJoin(
    vectors.map(v => this.vectorDB.insert(v))
  ).subscribe(
    () => console.log('All vectors inserted'),
    error => console.error('Insert error:', error)
  );
}
```

## API Reference

### VectorDBService

#### Methods

##### `initialize(): Promise<void>`

Initializes the WASM module. Usually called automatically.

##### `createDatabase(L?, mL?, efc?): Promise<SimpleVectorDB>`

Creates a new vector database instance.

Parameters:
- `L` (number, default: 5): Number of layers
- `mL` (number, default: 0.62): Layer multiplier
- `efc` (number, default: 10): Construction parameter

##### `getDatabase(): SimpleVectorDB | null`

Returns the current database instance.

##### `insert(vector: number[]): Observable<void>`

Inserts a vector into the database.

##### `search(query: number[], k?): Observable<SearchResult[]>`

Searches for k nearest neighbors.

Returns Observable of:
```typescript
interface SearchResult {
  distance: number;
  nodeIndex: number;
}
```

##### `save(): Observable<string>`

Serializes the database to JSON string.

##### `load(json: string): Observable<void>`

Loads a database from JSON string.

##### `destroy(): void`

Cleans up resources. Should be called in `ngOnDestroy`.

#### Properties

##### `isInitialized$: Observable<boolean>`

Observable that emits true when the WASM module is initialized.

## Best Practices

1. **Initialize in ngOnInit**: Create the database in the component's `ngOnInit` lifecycle hook
2. **Clean up in ngOnDestroy**: Always call `destroy()` in `ngOnDestroy` to free resources
3. **Error Handling**: Use RxJS operators like `catchError` to handle errors gracefully
4. **Persistence**: Use `save()` and `load()` with localStorage or backend storage

## TypeScript Support

Full TypeScript definitions are included with the package.

## License

MIT
