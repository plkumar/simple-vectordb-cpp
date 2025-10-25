# IndexedDB Persistence Guide

This guide explains how to use IndexedDB persistence features in SimpleVectorDB.

## Overview

IndexedDB allows you to store vector databases persistently in the browser, so they survive page refreshes and browser sessions. This is ideal for:

- **Offline-first applications**: Work without network connectivity
- **Caching embeddings**: Store expensive-to-compute vectors locally
- **Session persistence**: Maintain state across page reloads
- **Multiple databases**: Manage different vector sets separately

## Quick Start

```javascript
import { initializeWasm, SimpleVectorDB } from '@simple-vectordb/wasm';

// Initialize
await initializeWasm();
const db = new SimpleVectorDB();

// Add vectors
db.insert([1.0, 2.0, 3.0]);
db.insert([1.1, 2.1, 3.1]);

// Save to IndexedDB
await db.saveToIndexedDB('my-vectors');

// Load later (even after page refresh)
const loadedDb = await SimpleVectorDB.loadFromIndexedDB('my-vectors');
```

## Basic Operations

### Save a Database

```javascript
const db = new SimpleVectorDB();
// ... insert vectors ...

// Simple save
await db.saveToIndexedDB('product-embeddings');

// Save with metadata
await db.saveToIndexedDB('product-embeddings', {
  description: 'E-commerce product vectors',
  version: '2.0',
  category: 'electronics',
  totalVectors: 1000,
  lastUpdated: new Date().toISOString()
});
```

### Load a Database

```javascript
try {
  const db = await SimpleVectorDB.loadFromIndexedDB('product-embeddings');
  console.log('Database loaded successfully');
} catch (error) {
  console.error('Failed to load:', error.message);
}
```

### Check if Database Exists

```javascript
const exists = await SimpleVectorDB.indexedDBExists('product-embeddings');

if (exists) {
  const db = await SimpleVectorDB.loadFromIndexedDB('product-embeddings');
} else {
  const db = new SimpleVectorDB();
  // ... populate database ...
  await db.saveToIndexedDB('product-embeddings');
}
```

### Delete a Database

```javascript
await SimpleVectorDB.deleteFromIndexedDB('product-embeddings');
console.log('Database deleted');
```

### List All Stored Databases

```javascript
const databases = await SimpleVectorDB.listIndexedDBIndexes();

databases.forEach(db => {
  console.log(`Name: ${db.name}`);
  console.log(`Saved: ${new Date(db.timestamp).toLocaleString()}`);
  console.log(`Metadata:`, db.metadata);
  console.log('---');
});
```

### Clear All Databases

```javascript
// WARNING: This deletes ALL stored databases
await SimpleVectorDB.clearIndexedDB();
```

## Common Patterns

### Auto-save on Unload

```javascript
let db = new SimpleVectorDB();

// Auto-save when user leaves page
window.addEventListener('beforeunload', async (e) => {
  await db.saveToIndexedDB('auto-saved');
});

// Auto-load on page load
window.addEventListener('load', async () => {
  if (await SimpleVectorDB.indexedDBExists('auto-saved')) {
    db = await SimpleVectorDB.loadFromIndexedDB('auto-saved');
  }
});
```

### Versioned Databases

```javascript
// Save with version
const version = '1.0';
await db.saveToIndexedDB(`vectors-v${version}`, { version });

// Load specific version
const specificDb = await SimpleVectorDB.loadFromIndexedDB('vectors-v1.0');

// Or load latest
const databases = await SimpleVectorDB.listIndexedDBIndexes();
const latest = databases
  .filter(d => d.name.startsWith('vectors-v'))
  .sort((a, b) => b.timestamp - a.timestamp)[0];

if (latest) {
  const db = await SimpleVectorDB.loadFromIndexedDB(latest.name);
}
```

### Backup and Restore

```javascript
// Backup: Create snapshot
await db.saveToIndexedDB('vectors-backup-' + Date.now());

// Restore: Load from backup
const backups = await SimpleVectorDB.listIndexedDBIndexes();
const latestBackup = backups
  .filter(d => d.name.startsWith('vectors-backup-'))
  .sort((a, b) => b.timestamp - a.timestamp)[0];

const restoredDb = await SimpleVectorDB.loadFromIndexedDB(latestBackup.name);
```

### Conditional Save (Only if Changed)

```javascript
let lastSavedJSON = null;

async function saveIfChanged() {
  const currentJSON = db.toJSON();
  
  if (currentJSON !== lastSavedJSON) {
    await db.saveToIndexedDB('my-vectors');
    lastSavedJSON = currentJSON;
    console.log('Changes saved');
  } else {
    console.log('No changes to save');
  }
}
```

### Multiple Named Databases

```javascript
// Save different vector sets separately
const productsDb = new SimpleVectorDB();
// ... add product vectors ...
await productsDb.saveToIndexedDB('products');

const customersDb = new SimpleVectorDB();
// ... add customer vectors ...
await customersDb.saveToIndexedDB('customers');

// Load specific database
const products = await SimpleVectorDB.loadFromIndexedDB('products');
const customers = await SimpleVectorDB.loadFromIndexedDB('customers');
```

## Advanced Usage

### Using IndexedDBStorage Directly

For more control, use the `IndexedDBStorage` class:

```javascript
import { IndexedDBStorage } from '@simple-vectordb/wasm';

// Save raw JSON
const json = db.toJSON();
await IndexedDBStorage.save('my-vectors', json, {
  custom: 'metadata',
  tags: ['important', 'production']
});

// Load and inspect
const { data, metadata, timestamp } = await IndexedDBStorage.load('my-vectors');
console.log('Saved at:', new Date(timestamp));
console.log('Metadata:', metadata);

// Recreate database from JSON
const db = await SimpleVectorDB.fromJSON(data);
```

### Storage Size Monitoring

```javascript
// Get total storage size
const totalBytes = await IndexedDBStorage.getStorageSize();
const totalMB = (totalBytes / 1024 / 1024).toFixed(2);

console.log(`Total storage: ${totalMB} MB`);

// Check size before save
const jsonSize = new Blob([db.toJSON()]).size;
const sizeMB = (jsonSize / 1024 / 1024).toFixed(2);

if (jsonSize > 10 * 1024 * 1024) { // 10 MB
  console.warn(`Large database: ${sizeMB} MB`);
}

await db.saveToIndexedDB('large-vectors');
```

### Database Management UI

```javascript
async function displayDatabases() {
  const databases = await SimpleVectorDB.listIndexedDBIndexes();
  
  const list = databases.map(db => ({
    name: db.name,
    saved: new Date(db.timestamp).toLocaleString(),
    description: db.metadata.description || 'N/A',
    size: 'N/A' // Approximate from JSON length if needed
  }));
  
  console.table(list);
}

// Delete old databases (keep only last 5)
async function cleanupOldDatabases() {
  const databases = await SimpleVectorDB.listIndexedDBIndexes();
  const sorted = databases.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(5);
  
  for (const db of toDelete) {
    await SimpleVectorDB.deleteFromIndexedDB(db.name);
    console.log(`Deleted old database: ${db.name}`);
  }
}
```

## Best Practices

### 1. Always Initialize WASM First

```javascript
// ✅ Good
await initializeWasm();
const db = await SimpleVectorDB.loadFromIndexedDB('vectors');

// ❌ Bad - will fail
const db = await SimpleVectorDB.loadFromIndexedDB('vectors');
```

### 2. Handle Errors Gracefully

```javascript
try {
  const db = await SimpleVectorDB.loadFromIndexedDB('vectors');
} catch (error) {
  console.error('Failed to load:', error);
  // Fallback: create new database
  const db = new SimpleVectorDB();
}
```

### 3. Clean Up Memory

```javascript
const db = await SimpleVectorDB.loadFromIndexedDB('vectors');
// ... use database ...
db.delete(); // Free WASM memory
```

### 4. Use Meaningful Names

```javascript
// ✅ Good
await db.saveToIndexedDB('user-123-preferences');
await db.saveToIndexedDB('product-embeddings-v2');

// ❌ Bad
await db.saveToIndexedDB('db1');
await db.saveToIndexedDB('temp');
```

### 5. Add Metadata

```javascript
await db.saveToIndexedDB('vectors', {
  description: 'Product embeddings',
  version: '2.0',
  model: 'sentence-transformers',
  dimensions: 384,
  count: vectorCount,
  createdBy: userId,
  lastUpdated: new Date().toISOString()
});
```

### 6. Monitor Storage Quotas

```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
  console.log(`Storage used: ${percentUsed}%`);
  
  if (percentUsed > 80) {
    console.warn('Storage quota nearly full!');
  }
}
```

## Limitations

1. **Browser Support**: IndexedDB is not available in all environments (e.g., Node.js without polyfill)
2. **Storage Limits**: Browsers have storage quotas (typically 50% of free disk space)
3. **Performance**: Large databases (>100MB) may be slow to save/load
4. **Synchronous WASM**: WASM operations are synchronous but IndexedDB is async

## Troubleshooting

### Database Not Found

```javascript
// Check if database exists before loading
if (await SimpleVectorDB.indexedDBExists('my-vectors')) {
  const db = await SimpleVectorDB.loadFromIndexedDB('my-vectors');
} else {
  console.log('Database not found, creating new one');
  const db = new SimpleVectorDB();
}
```

### Quota Exceeded

```javascript
try {
  await db.saveToIndexedDB('large-vectors');
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage quota exceeded!');
    // Clean up old databases or notify user
  }
}
```

### Corrupted Data

```javascript
try {
  const db = await SimpleVectorDB.loadFromIndexedDB('vectors');
} catch (error) {
  console.error('Failed to load database:', error);
  // Delete corrupted database
  await SimpleVectorDB.deleteFromIndexedDB('vectors');
  // Create fresh database
  const newDb = new SimpleVectorDB();
}
```

## Examples

See the complete examples in:
- `example-indexeddb.html` - Interactive browser demo
- `test-indexeddb.js` - Automated tests

## Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 24+ |
| Firefox | 16+ |
| Safari | 10+ |
| Edge | 12+ |
| Opera | 15+ |

IndexedDB is widely supported in modern browsers. For older browsers or Node.js, consider using a polyfill or fallback to localStorage (for smaller datasets).
