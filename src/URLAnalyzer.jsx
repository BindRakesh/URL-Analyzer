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

    // const backendUrl = 'ws://192.168.0.132:8080/analyze';
    // const backendUrl = "wss://url-journey-backend.onrender.com/analyze"; //render-2
    const backendUrl = 'wss://url-analyzer-backend-1-production.up.railway.app/analyze';   //railway anil
     //const backendUrl = 'wss://web-production-a69a9.up.railway.app/analyze'; //railway rakesh
    // const backendUrl = 'wss://url-analyzer-backend.onrender.com/analyze'; //render
    // const backendUrl = 'ws://localhost:8080/analyze'; //localhost
    // const backendUrl = 'ws://192.168.0.132:8080/analyze';

    const websocket = new WebSocket(backendUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ urls: urlList }));
      setStartTime(Date.now());
    };

    websocket.onmessage = (event) => {
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
      const maxHops = results.reduce((max, r) => Math.max(max, r.redirectChain?.length || 0), 0);

      const worksheetData = results.map(r => {
        const row = {
          'Original URL': r.originalURL,
          'Final URL': r.finalURL || 'N/A',
          'Hop Count': r.redirectChain?.length || 0,
          'Final Target Status': r.redirectChain?.[r.redirectChain.length - 1]?.status ?? 'N/A',
          'Total Time (s)': r.totalTime?.toFixed(2) || 'N/A',
          'Error': r.error || '',
        };

        for (let i = 0; i < maxHops; i++) {
          const hop = r.redirectChain?.[i];
          if (hop) {
            row[`Hop ${i + 1} URL`] = hop.url;
            row[`Hop ${i + 1} Status`] = hop.status ?? 'Unknown';
            row[`Hop ${i + 1} Server`] = hop.server ?? 'Unknown';
          } else {
            row[`Hop ${i + 1} URL`] = '';
            row[`Hop ${i + 1} Status`] = '';
            row[`Hop ${i + 1} Server`] = '';
          }
        }
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // --- BEAUTIFICATION START ---
      // Auto-fit column widths
      const objectMaxLength = [];
      const columnHeaders = Object.keys(worksheetData[0] || {});
      
      // Find the max length of the header
      columnHeaders.forEach(header => {
        objectMaxLength.push(header.length);
      });

      // Find the max length of the data in each column
      worksheetData.forEach(data => {
        Object.values(data).forEach((value, i) => {
          const valueLength = value ? String(value).length : 0;
          if (valueLength > objectMaxLength[i]) {
            objectMaxLength[i] = valueLength;
          }
        });
      });

      // Add a little extra padding to the width
      worksheet['!cols'] = objectMaxLength.map(width => ({ wch: width + 2 }));
      // --- BEAUTIFICATION END ---

      const workbook = XLSX.utils.book_new();
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
