import React, { useState } from 'react';
import { VectorDBProvider, useVectorDB } from '@simple-vectordb/react';
import './App.css';

function VectorDBDemo() {
  const { db, insert, search, save, load, isReady } = useVectorDB(5, 0.62, 10);
  const [vectorInput, setVectorInput] = useState('1.0, 2.0, 3.0');
  const [searchQuery, setSearchQuery] = useState('1.1, 2.1, 3.1');
  const [k, setK] = useState(5);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const parseVector = (str) => {
    return str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  };

  const handleInsert = () => {
    try {
      const vector = parseVector(vectorInput);
      if (vector.length === 0) {
        setMessage('Invalid vector format');
        return;
      }
      insert(vector);
      setMessage(`Inserted vector: [${vector.join(', ')}]`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSearch = () => {
    try {
      const query = parseVector(searchQuery);
      if (query.length === 0) {
        setMessage('Invalid query format');
        return;
      }
      const searchResults = search(query, k);
      setResults(searchResults);
      setMessage(`Found ${searchResults.length} results`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSave = () => {
    try {
      const json = save();
      localStorage.setItem('vectordb', json);
      setMessage('Database saved to localStorage');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleLoad = async () => {
    try {
      const json = localStorage.getItem('vectordb');
      if (!json) {
        setMessage('No saved database found');
        return;
      }
      await load(json);
      setMessage('Database loaded from localStorage');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  if (!isReady) {
    return <div className="loading">Loading WASM module...</div>;
  }

  return (
    <div className="app">
      <h1>SimpleVectorDB React Demo</h1>

      <div className="section">
        <h2>Insert Vector</h2>
        <input
          type="text"
          value={vectorInput}
          onChange={(e) => setVectorInput(e.target.value)}
          placeholder="1.0, 2.0, 3.0"
        />
        <button onClick={handleInsert}>Insert</button>
      </div>

      <div className="section">
        <h2>Search</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="1.1, 2.1, 3.1"
        />
        <input
          type="number"
          value={k}
          onChange={(e) => setK(parseInt(e.target.value))}
          min="1"
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="section">
        <h2>Persistence</h2>
        <button onClick={handleSave}>Save to LocalStorage</button>
        <button onClick={handleLoad}>Load from LocalStorage</button>
      </div>

      {message && (
        <div className="message">{message}</div>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Search Results</h2>
          <table>
            <thead>
              <tr>
                <th>Node Index</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.nodeIndex}</td>
                  <td>{result.distance.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <VectorDBProvider>
      <VectorDBDemo />
    </VectorDBProvider>
  );
}

export default App;
