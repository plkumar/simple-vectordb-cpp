import { Component, OnInit, OnDestroy } from '@angular/core';
import { VectorDBService, SearchResult } from '@simple-vectordb/angular';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <h1>SimpleVectorDB Angular Demo</h1>

      <div class="section">
        <h2>Insert Vector</h2>
        <input
          type="text"
          [(ngModel)]="vectorInput"
          placeholder="1.0, 2.0, 3.0"
        />
        <button (click)="handleInsert()">Insert</button>
      </div>

      <div class="section">
        <h2>Search</h2>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="1.1, 2.1, 3.1"
        />
        <input
          type="number"
          [(ngModel)]="k"
          min="1"
        />
        <button (click)="handleSearch()">Search</button>
      </div>

      <div class="section">
        <h2>Persistence</h2>
        <button (click)="handleSave()">Save to LocalStorage</button>
        <button (click)="handleLoad()">Load from LocalStorage</button>
      </div>

      <div class="message" *ngIf="message">
        {{ message }}
      </div>

      <div class="results" *ngIf="results.length > 0">
        <h2>Search Results</h2>
        <table>
          <thead>
            <tr>
              <th>Node Index</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let result of results">
              <td>{{ result.nodeIndex }}</td>
              <td>{{ result.distance | number:'1.4-4' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .app {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .section {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    input {
      margin: 0 10px;
      padding: 5px 10px;
    }

    button {
      padding: 5px 15px;
      margin: 0 5px;
    }

    .message {
      padding: 10px;
      margin: 10px 0;
      background-color: #f0f0f0;
      border-radius: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background-color: #f5f5f5;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  vectorInput = '1.0, 2.0, 3.0';
  searchQuery = '1.1, 2.1, 3.1';
  k = 5;
  results: SearchResult[] = [];
  message = '';

  constructor(private vectorDB: VectorDBService) {}

  async ngOnInit() {
    try {
      await this.vectorDB.createDatabase(5, 0.62, 10);
      this.message = 'Database initialized';
    } catch (error) {
      this.message = `Initialization error: ${error}`;
    }
  }

  parseVector(str: string): number[] {
    return str
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));
  }

  handleInsert() {
    try {
      const vector = this.parseVector(this.vectorInput);
      if (vector.length === 0) {
        this.message = 'Invalid vector format';
        return;
      }

      this.vectorDB.insert(vector).subscribe({
        next: () => {
          this.message = `Inserted vector: [${vector.join(', ')}]`;
        },
        error: (error) => {
          this.message = `Error: ${error.message}`;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
    }
  }

  handleSearch() {
    try {
      const query = this.parseVector(this.searchQuery);
      if (query.length === 0) {
        this.message = 'Invalid query format';
        return;
      }

      this.vectorDB.search(query, this.k).subscribe({
        next: (results) => {
          this.results = results;
          this.message = `Found ${results.length} results`;
        },
        error: (error) => {
          this.message = `Error: ${error.message}`;
        }
      });
    } catch (error) {
      this.message = `Error: ${error}`;
    }
  }

  handleSave() {
    this.vectorDB.save().subscribe({
      next: (json) => {
        localStorage.setItem('vectordb', json);
        this.message = 'Database saved to localStorage';
      },
      error: (error) => {
        this.message = `Error: ${error.message}`;
      }
    });
  }

  handleLoad() {
    const json = localStorage.getItem('vectordb');
    if (!json) {
      this.message = 'No saved database found';
      return;
    }

    this.vectorDB.load(json).subscribe({
      next: () => {
        this.message = 'Database loaded from localStorage';
      },
      error: (error) => {
        this.message = `Error: ${error.message}`;
      }
    });
  }

  ngOnDestroy() {
    this.vectorDB.destroy();
  }
}
