// src/components/ResultCard.jsx
import React from 'react';

const ResultCard = ({ result, index, expandedChains, toggleChain }) => {
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
  );
};

export default ResultCard;