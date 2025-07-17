// src/components/InputForm.jsx
import React, { useState } from 'react';

const InputForm = ({ urls, setUrls, analyzeURLs, pasteFromClipboard, isLoading }) => {
  const [error, setError] = useState('');

  // Check if any URL contains "b2b"
  const hasB2B = (input) => {
    const urlList = input.split('\n').filter(url => url.trim() !== '');
    return urlList.some(url => url.toLowerCase().includes('b2b-'));
  };

  // Handle URL input change with b2b validation
  const handleUrlChange = (e) => {
    const input = e.target.value;
    setUrls(input);
    
    if (hasB2B(input)) {
      setError('Please don\'t enter test links');
    } else {
      setError('');
    }
  };

  // Handle paste from clipboard with b2b validation
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrls(text);
      
      if (hasB2B(text)) {
        setError('Please don\'t enter test links');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  // Prevent analysis if there are b2b URLs
  const handleAnalyze = () => {
    if (hasB2B(urls)) {
      setError('Please don\'t enter test links');
      return;
    }
    
    const urlList = urls.split('\n').filter(url => url.trim() !== '');
    if (urlList.length === 0) {
      setError('Please enter at least one URL');
      return;
    }
    
    analyzeURLs();
  };

  return (
    <div className="mb-6 flex flex-col gap-2">
      <textarea
        className={`w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300 dark:border-gray-600'
        } resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-white`}
        rows="5"
        value={urls}
        onChange={handleUrlChange}
        placeholder="Enter URLs (one per line), e.g., google.com or http://www.bmw.in"
        disabled={isLoading}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          className={`flex-1 py-2 rounded-lg text-white font-semibold ${
            isLoading || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          } transition-colors`}
          onClick={handleAnalyze}
          disabled={isLoading || error}
        >
          {isLoading ? 'Analyzing...' : 'Analyze URLs'}
        </button>
        <button
          className="py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold transition-colors"
          onClick={handlePaste}
          disabled={isLoading}
        >
          Paste from Clipboard
        </button>
      </div>
    </div>
  );
};

export default InputForm;
