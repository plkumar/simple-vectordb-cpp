# SimpleVectorDB Test Suite

Comprehensive unit and integration tests for the SimpleVectorDB WASM package.

## Overview

This test suite provides thorough coverage of:
- Core SimpleVectorDB functionality (insert, search, serialization)
- IndexedDB persistence layer
- Integration between vector operations and storage
- Edge cases and error handling
- Performance characteristics

## Test Structure

```
packages/tests/
├── __tests__/
│   ├── simple-vectordb.test.js      # Core SimpleVectorDB class tests
│   ├── indexeddb-storage.test.js    # IndexedDB persistence tests
│   └── integration.test.js          # Integration tests
├── setup.js                          # Test environment setup
├── package.json                      # Test configuration
└── README.md                         # This file
```

## Prerequisites

```bash
cd packages/tests
npm install
```

This will install:
- **Jest** - Testing framework
- **fake-indexeddb** - IndexedDB polyfill for Node.js
- **@jest/globals** - Jest API imports

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test simple-vectordb.test.js
npm test indexeddb-storage.test.js
npm test integration.test.js
```

### Run specific test suite
```bash
npm test -- -t "insert()"
npm test -- -t "IndexedDB"
```

## Test Coverage

### simple-vectordb.test.js (Core Functionality)

**Constructor Tests**
- ✅ Default parameters
- ✅ Custom parameters (L, mL, efc)
- ✅ WASM module initialization

**Insert Tests** (15+ test cases)
- ✅ Single vector insertion
- ✅ Multiple vectors
- ✅ Different dimensions
- ✅ Floating point numbers
- ✅ Negative numbers
- ✅ Zero vectors
- ✅ Error handling for invalid inputs

**Search Tests** (12+ test cases)
- ✅ Basic search
- ✅ Result structure (distance, nodeIndex)
- ✅ Result sorting by distance
- ✅ Exact match finding
- ✅ k parameter handling
- ✅ Empty database handling
- ✅ Error handling

**Serialization Tests** (10+ test cases)
- ✅ toJSON() serialization
- ✅ fromJSON() deserialization
- ✅ Empty database serialization
- ✅ Multiple vectors serialization
- ✅ Search results preservation
- ✅ Invalid JSON handling

**Integration Tests** (5+ test cases)
- ✅ Complete workflow (insert → search → serialize → deserialize)
- ✅ Large number of vectors (100+)
- ✅ High-dimensional vectors (128D)
- ✅ Performance benchmarks

### indexeddb-storage.test.js (Persistence Layer)

**Save/Load Tests** (10+ test cases)
- ✅ Save and load index data
- ✅ Metadata preservation
- ✅ Overwrites and updates
- ✅ Large data handling (1MB+)
- ✅ Special characters in names

**Delete Tests** (5+ test cases)
- ✅ Single index deletion
- ✅ Non-existent index handling
- ✅ Re-save after deletion

**List Tests** (5+ test cases)
- ✅ Empty database
- ✅ Multiple indexes
- ✅ Metadata filtering

**Utility Tests** (8+ test cases)
- ✅ exists() - Check index existence
- ✅ clear() - Remove all indexes
- ✅ getStorageSize() - Storage usage
- ✅ Empty strings and edge cases

**Edge Cases** (10+ test cases)
- ✅ Concurrent operations
- ✅ Complex nested metadata
- ✅ Very long names
- ✅ Unicode characters

### integration.test.js (End-to-End)

**Complete Workflow Tests** (5+ test cases)
- ✅ Create → Populate → Save → Load → Search
- ✅ Multiple save/load cycles
- ✅ Index integrity across operations

**Multiple Indexes Tests** (5+ test cases)
- ✅ Independent index management
- ✅ Selective deletion
- ✅ Metadata per index

**Storage Management Tests** (5+ test cases)
- ✅ Storage size tracking
- ✅ Size reduction after deletion
- ✅ Large dataset handling

**Error Handling Tests** (5+ test cases)
- ✅ Non-existent index loading
- ✅ Corrupted data handling
- ✅ Empty database operations

**Concurrent Operations Tests** (5+ test cases)
- ✅ Concurrent saves
- ✅ Concurrent loads
- ✅ Mixed operations

**Performance Tests** (2+ test cases)
- ✅ Large index (500+ vectors) save/load timing
- ✅ Operation efficiency benchmarks

## Mock Strategy

### WASM Module Mocking

Since the actual WASM module requires compilation and browser environment, tests use a mock implementation:

```javascript
// setup.js creates MockSimpleHNSWIndex
class MockSimpleHNSWIndex {
  constructor(L = 5, mL = 0.62, efc = 10) {
    this.L = L;
    this.mL = mL;
    this.efc = efc;
    this.vectors = [];
  }

  insert(vector) {
    this.vectors.push([...vector]);
  }

  search(query, k) {
    // Euclidean distance calculation
    // Returns sorted results by distance
  }

  toJSON() {
    return JSON.stringify({
      L: this.L,
      mL: this.mL,
      efc: this.efc,
      index: this.vectors
    });
  }

  static fromJSON(json) {
    // Deserializes and reconstructs index
  }
}
```

### IndexedDB Mocking

Uses `fake-indexeddb` package for Node.js environment:

```javascript
// setup.js
import 'fake-indexeddb/auto';
```

This provides a full IndexedDB implementation that works in Node.js, allowing realistic tests without a browser.

## Test Environment

### Configuration (package.json)

```json
{
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "npm test -- --watch",
    "test:coverage": "npm test -- --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFiles": ["./setup.js"],
    "testMatch": ["**/__tests__/**/*.test.js"],
    "transform": {}
  }
}
```

### Key Features
- **ES Modules**: Uses native ES6 modules (`type: "module"`)
- **jsdom**: Browser-like environment for DOM APIs
- **No transpilation**: Tests run directly without Babel
- **Setup file**: Automatically loads mocks before each test

## Coverage Goals

Target coverage metrics:
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

View coverage report:
```bash
npm run test:coverage
```

Coverage HTML report generated in `coverage/` directory.

## Writing New Tests

### Template for new test file

```javascript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Feature Name', () => {
  let db;

  beforeEach(() => {
    // Setup before each test
    db = new SimpleVectorDB();
  });

  afterEach(() => {
    // Cleanup after each test
    if (db) {
      db.delete();
    }
  });

  describe('Specific functionality', () => {
    test('should do something specific', () => {
      // Arrange
      const input = [1.0, 2.0, 3.0];
      
      // Act
      db.insert(input);
      
      // Assert
      expect(db.index.vectors).toHaveLength(1);
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up resources in `afterEach`
3. **Descriptive names**: Use clear, descriptive test names
4. **AAA pattern**: Arrange, Act, Assert
5. **Edge cases**: Test boundaries and error conditions
6. **Async handling**: Use `async/await` for Promise-based operations

## Debugging Tests

### Run single test with verbose output
```bash
npm test -- -t "specific test name" --verbose
```

### Debug with Node inspector
```bash
node --inspect-brk --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
```

Then open `chrome://inspect` in Chrome.

### Common Issues

**Issue**: `Cannot find module 'fake-indexeddb/auto'`
**Solution**: Run `npm install` in the tests directory

**Issue**: `ReferenceError: TextEncoder is not defined`
**Solution**: Ensure `setup.js` is loaded (check jest.setupFiles)

**Issue**: Tests timeout
**Solution**: Increase timeout with `jest.setTimeout(10000)` in setup.js

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd packages/tests && npm install
      - run: cd packages/tests && npm test
      - run: cd packages/tests && npm run test:coverage
```

## Performance Benchmarks

### Expected Performance
- Insert 1000 vectors: < 5 seconds
- Search 100 queries: < 5 seconds
- Save 500-vector index: < 5 seconds
- Load 500-vector index: < 5 seconds

Run performance tests:
```bash
npm test -- -t "Performance"
```

## Related Documentation

- [Packages Overview](../../PACKAGES_OVERVIEW.md)
- [Quick Start Guide](../../QUICK_START.md)
- [IndexedDB Guide](../../INDEXEDDB_GUIDE.md)
- [Architecture](../../ARCHITECTURE.md)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass (`npm test`)
3. Maintain coverage above 90% (`npm run test:coverage`)
4. Update this README if adding new test categories

## License

MIT License - See project root for details
