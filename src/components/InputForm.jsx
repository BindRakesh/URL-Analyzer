// src/components/InputForm.jsx
import React from 'react';

const InputForm = ({ urls, setUrls, analyzeURLs, pasteFromClipboard, isLoading }) => {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <textarea
        className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
        rows="5"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Enter URLs (one per line), e.g., google.com or http://www.bmw.in"
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
  );
};

export default InputForm;