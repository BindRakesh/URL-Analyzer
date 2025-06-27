// src/URLAnalyzer.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ProgressSidebar from './components/ProgressSidebar';
import ResultCard from './components/ResultCard';


const URLAnalyzer = () => {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedChains, setExpandedChains] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [currentProcessingUrl, setCurrentProcessingUrl] = useState('');
  const [totalUrls, setTotalUrls] = useState(0);
  const [analyzedUrls, setAnalyzedUrls] = useState(0);
  const [averageTimePerUrl, setAverageTimePerUrl] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [actualTimeTaken, setActualTimeTaken] = useState(0);

  // Use a ref to store the WebSocket instance to prevent closing on re-render
  const wsRef = useRef(null);

  const analyzeURLs = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    setExpandedChains({});
    setCurrentProcessingUrl('');
    setAnalyzedUrls(0);
    setAverageTimePerUrl(0);
    setStartTime(null);
    setActualTimeTaken(0);

    const urlList = urls.split('\n').filter(url => url.trim());
    setTotalUrls(urlList.length);

     const backendUrl = 'wss://url-analyzer-backend-1-production.up.railway.app/test';   //railway anil
     //const backendUrl = 'wss://web-production-a69a9.up.railway.app/analyze'; //railway rakesh
    // const backendUrl = 'wss://url-analyzer-backend.onrender.com/analyze'; //render
    // const backendUrl = 'ws://localhost:8080/analyze'; //localhost
    const websocket = new WebSocket(backendUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("WebSocket connected");
      websocket.send(JSON.stringify({ urls: urlList }));
      setStartTime(Date.now());
    };

    websocket.onmessage = (event) => {
      console.log("Received:", event.data);
      const data = JSON.parse(event.data);
      if (data.done) {
        setIsLoading(false);
        setCurrentProcessingUrl('');
        websocket.close();
        wsRef.current = null;
        setUrls('');
        if (startTime) {
          const elapsedTime = (Date.now() - startTime) / 1000;
          setActualTimeTaken(elapsedTime);
        }
      } else if (data.error) {
        setError(data.error);
        setIsLoading(false);
        setCurrentProcessingUrl('');
        websocket.close();
        wsRef.current = null;
      } else if (data.status === "processing") {
        setCurrentProcessingUrl(data.url);
      } else {
        setResults((prev) => [...prev, { ...data, isAnalyzing: false }]);
        setCurrentProcessingUrl('');
        setAnalyzedUrls((prev) => {
          const newCount = prev + 1;
          if (newCount > 0 && startTime) {
            const elapsedTime = (Date.now() - startTime) / 1000;
            const avgTime = elapsedTime / newCount;
            setAverageTimePerUrl(avgTime);
            setActualTimeTaken(elapsedTime);
          }
          return newCount;
        });
      }
    };

    websocket.onerror = () => {
      setError('Failed to connect to the server or connection interrupted');
      setIsLoading(false);
      setCurrentProcessingUrl('');
      websocket.close();
      wsRef.current = null;
    };

    websocket.onclose = () => {
      setIsLoading(false);
      setCurrentProcessingUrl('');
    };
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
  }, [theme]);

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Header theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Main Content */}
        <div className="p-6 max-w-4xl mx-auto w-full">
          <InputForm
            urls={urls}
            setUrls={setUrls}
            analyzeURLs={analyzeURLs}
            pasteFromClipboard={pasteFromClipboard}
            isLoading={isLoading}
          />

          {currentProcessingUrl && (
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg shadow">
              <strong>Processing:</strong> {currentProcessingUrl}
            </div>
          )}

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
                  <ResultCard
                    key={index}
                    result={result}
                    index={index}
                    expandedChains={expandedChains}
                    toggleChain={toggleChain}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Sidebar */}
        {totalUrls > 0 && (
          <ProgressSidebar
            totalUrls={totalUrls}
            analyzedUrls={analyzedUrls}
            averageTimePerUrl={averageTimePerUrl}
            actualTimeTaken={actualTimeTaken}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Add CSS for the gradient animation */}
      <style>
        {`
          @keyframes gradientMove {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 200% 50%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default URLAnalyzer;
