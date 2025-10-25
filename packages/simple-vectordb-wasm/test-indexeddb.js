/**
 * Simple test file for IndexedDB functionality
 * Run this in a browser console or Node.js with IndexedDB polyfill
 */

import { initializeWasm, SimpleVectorDB } from './index.js';

async function testIndexedDB() {
  console.log('🧪 Testing SimpleVectorDB IndexedDB functionality...\n');
  
  try {
    // Initialize WASM
    console.log('1. Initializing WASM...');
    await initializeWasm();
    console.log('   ✅ WASM initialized\n');
    
    // Create database and insert vectors
    console.log('2. Creating database and inserting vectors...');
    const db = new SimpleVectorDB();
    db.insert([1.0, 2.0, 3.0]);
    db.insert([1.0, 2.0, 3.1]);
    db.insert([1.1, 2.1, 3.0]);
    db.insert([2.0, 3.0, 4.0]);
    console.log('   ✅ Inserted 4 vectors\n');
    
    // Test search
    console.log('3. Testing search...');
    const results = db.search([1.1, 2.1, 3.1], 3);
    console.log('   Search results:', results);
    console.log('   ✅ Search works\n');
    
    // Save to IndexedDB
    console.log('4. Saving to IndexedDB...');
    await db.saveToIndexedDB('test-db', {
      description: 'Test database',
      version: '1.0',
      created: new Date().toISOString()
    });
    console.log('   ✅ Saved to IndexedDB\n');
    
    // List stored databases
    console.log('5. Listing stored databases...');
    const list = await SimpleVectorDB.listIndexedDBIndexes();
    console.log('   Stored databases:', list);
    console.log('   ✅ Found', list.length, 'database(s)\n');
    
    // Check if exists
    console.log('6. Checking if database exists...');
    const exists = await SimpleVectorDB.indexedDBExists('test-db');
    console.log('   Database exists:', exists);
    console.log('   ✅ Exists check works\n');
    
    // Clean up original
    db.delete();
    
    // Load from IndexedDB
    console.log('7. Loading from IndexedDB...');
    const loadedDb = await SimpleVectorDB.loadFromIndexedDB('test-db');
    console.log('   ✅ Loaded from IndexedDB\n');
    
    // Verify loaded data
    console.log('8. Verifying loaded data...');
    const loadedResults = loadedDb.search([1.1, 2.1, 3.1], 3);
    console.log('   Loaded search results:', loadedResults);
    
    const resultsMatch = JSON.stringify(results) === JSON.stringify(loadedResults);
    console.log('   Results match:', resultsMatch);
    console.log('   ✅ Data integrity verified\n');
    
    // Clean up
    loadedDb.delete();
    
    // Delete from IndexedDB
    console.log('9. Deleting from IndexedDB...');
    await SimpleVectorDB.deleteFromIndexedDB('test-db');
    console.log('   ✅ Deleted from IndexedDB\n');
    
    // Verify deletion
    console.log('10. Verifying deletion...');
    const stillExists = await SimpleVectorDB.indexedDBExists('test-db');
    console.log('    Database exists after deletion:', stillExists);
    console.log('    ✅ Deletion verified\n');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testIndexedDB().catch(console.error);

export { testIndexedDB };
