// src/components/ResultCard.jsx
import React from 'react';

const ResultCard = ({ result, index, expandedChains, toggleChain }) => {

  // Helper function to get status badge colors, same as in the detailed view
  const getStatusClass = (status) => {
    if (status === 200) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (status >= 300 && status < 400) return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    if (status >= 400) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 relative">
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
            <div className="mt-4">
              {/* --- MODIFICATION START --- */}
              <button
                className="w-full p-2 -m-2 font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md flex items-center justify-between gap-3 text-left"
                onClick={() => toggleChain(index)}
              >
                {/* Left side wrapper for text and the new hop summary */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span>Redirect Chain</span>
                  {/* The new horizontal hop status display */}
                  <div className="flex items-center gap-x-2 font-normal">
                    {result.redirectChain.map((hop, idx) => (
                      <React.Fragment key={`summary-${idx}`}>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(hop.status)}`}>
                          {hop.status ?? 'N/A'}
                        </span>
                        {idx < result.redirectChain.length - 1 && (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Right side: The toggle arrow */}
                <span className="text-xl">{expandedChains[index] ? '▴' : '▾'}</span>
              </button>
              {/* --- MODIFICATION END --- */}

              {expandedChains[index] && (
                <div className="mt-4 space-y-4">
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
                          <span className={`px-2 py-1 rounded ${getStatusClass(hop.status)}`}>
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
  );
};

export default ResultCard;
