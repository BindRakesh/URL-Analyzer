import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import '../styles/ToggleSwitch.css';

const URLAnalyzer = () => {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ws, setWs] = useState(null);
  const [expandedChains, setExpandedChains] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const analyzeURLs = () => {
    if (ws) ws.close();

    setIsLoading(true);
    setError('');
    setResults([]);
    setExpandedChains({});

    // const backendUrl = process?.env?.REACT_APP_BACKEND_URL || 'ws://localhost:5000/analyze';
    // const backendUrl = 'wss://web-production-a69a9.up.railway.app/analyze';
    const backendUrl = 'wss://web-production-a69a9.up.railway.app/analyze';

    const websocket = new WebSocket(backendUrl);
    setWs(websocket);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        urls: urls.split('\n').filter(url => url.trim())
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.done) {
        setIsLoading(false);
        websocket.close();
        setUrls('');
      } else if (data.error) {
        setError(data.error);
        setIsLoading(false);
        websocket.close();
      } else {
        setResults((prev) => [...prev, { ...data, isAnalyzing: false }]);
      }
    };

    websocket.onerror = () => {
      setError('Failed to connect to the server or connection interrupted');
      setIsLoading(false);
      websocket.close();
    };

    websocket.onclose = () => setIsLoading(false);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrls(text);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  const exportResults = (format) => {
    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheetData = results.flatMap((r, idx) =>
        r.redirectChain.map((hop, hopIdx) => ({
          'Result #': idx + 1,
          'Original URL': r.originalURL,
          'Final URL': r.finalURL,
          'Total Time (s)': r.totalTime?.toFixed(2) || 'N/A',
          'Hop #': hopIdx + 1,
          'Hop URL': hop.url,
          'Status': hop.status ?? 'Unknown',
          'Server': hop.server ?? 'Unknown',
          'Hop Time (s)': hop.timestamp?.toFixed(2) || 'N/A',
        }))
      );
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'URL Analysis');
      XLSX.writeFile(workbook, `url_analysis_${new Date().toISOString()}.xlsx`);
    } else {
      const dataStr = format === 'json'
        ? JSON.stringify(results, null, 2)
        : results.map(r => `${r.originalURL},${r.finalURL},${r.totalTime},${r.redirectChain.map(h => `${h.url}:${h.status}`).join(';')}`).join('\n');
      const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `url_analysis_${new Date().toISOString()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleChain = (index) => {
    setExpandedChains(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    return () => ws && ws.close();
  }, [theme, ws]);

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className="sticky top-0 z-10 flex justify-between items-center p-6 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">URL Journey</h1>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/bindrakesh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-blue-600 dark:text-blue-400 hover:underline"
          >
            About Me
          </a>
          <label className="switch">
            <span className="sun">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g fill="#ffd43b">
                  <circle r="5" cy="12" cx="12"></circle>
                  <path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z"></path>
                </g>
              </svg>
            </span>
            <span className="moon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"></path>
              </svg>
            </span>
            <input type="checkbox" className="input" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex flex-col gap-2">
          <textarea
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
            rows="5"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Enter URLs (one per line), e.g., google.com or https://example.com"
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <button
              className={`flex-1 py-2 rounded-lg text-white font-semibold ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} transition-colors`}
              onClick={analyzeURLs}
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze URLs'}
            </button>
            <button
              className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold transition-colors"
              onClick={pasteFromClipboard}
              disabled={isLoading}
            >
              Paste from Clipboard
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg shadow">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-end gap-2 mb-4 flex-wrap">
              <button
                className="py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold transition-colors"
                onClick={() => exportResults('json')}
              >
                Export as JSON
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold transition-colors"
                onClick={() => exportResults('csv')}
              >
                Export as CSV
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold transition-colors"
                onClick={() => exportResults('excel')}
              >
                Export as Excel
              </button>
            </div>

            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 relative">
                  {result.isAnalyzing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse" />
                  )}
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    <strong>Original URL:</strong>{' '}
                    <a href={result.originalURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {result.originalURL}
                    </a>
                  </div>
                  {result.error ? (
                    <div className="mt-2 text-red-600 dark:text-red-400">Error: {result.error}</div>
                  ) : (
                    <>
                      <div className="mt-2 text-gray-800 dark:text-white">
                        <strong>Final URL:</strong>{' '}
                        <a href={result.finalURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                          {result.finalURL}
                        </a>
                      </div>
                      <div className="mt-2 text-gray-800 dark:text-white">
                        <strong>Total Time:</strong>{' '}
                        {result.totalTime !== undefined ? `${result.totalTime.toFixed(2)} seconds` : 'N/A'}
                      </div>
                      {result.redirectChain?.length > 0 && (
                        <div className="mt-3">
                          <button
                            className="font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                            onClick={() => toggleChain(index)}
                          >
                            <span>Redirect Chain</span>
                            <span>{expandedChains[index] ? '▼' : '▶'}</span>
                          </button>
                          {expandedChains[index] && (
                            <div className="mt-2 space-y-4">
                              {result.redirectChain.map((hop, idx) => (
                                <div key={idx} className="relative pl-10">
                                  <div className="absolute left-4 top-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold z-10">
                                    {idx + 1}
                                  </div>
                                  {idx < result.redirectChain.length - 1 && (
                                    <div className="absolute left-[1.65rem] top-6 h-[calc(100%-1rem)] w-0.5 bg-gray-300 dark:bg-gray-600" />
                                  )}
                                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm text-gray-800 dark:text-white">
                                    <div className="truncate" title={hop.url}>
                                      <strong>URL:</strong>{' '}
                                      <a href={hop.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {hop.url}
                                      </a>
                                    </div>
                                    <div>
                                      <strong>Status:</strong>{' '}
                                      <span className={`px-2 py-1 rounded ${
                                        hop.status === 200 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                        hop.status >= 300 && hop.status < 400 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                      }`}>
                                        {hop.status ?? 'Unknown'}
                                      </span>
                                    </div>
                                    <div>
                                      <strong>Server:</strong> {hop.server ?? 'Unknown'}
                                    </div>
                                    <div>
                                      <strong>Time:</strong> {hop.timestamp !== undefined ? `${hop.timestamp.toFixed(2)}s` : 'N/A'}
                                    </div>
                                    {hop.error && <div className="text-red-600 dark:text-red-400">Error: {hop.error}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLAnalyzer;