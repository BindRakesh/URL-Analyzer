// src/components/ProgressSidebar.jsx
import React from 'react';

const ProgressSidebar = ({ totalUrls, analyzedUrls, averageTimePerUrl, actualTimeTaken, isLoading }) => {
  const progressPercentage = totalUrls > 0 ? (analyzedUrls / totalUrls) * 100 : 0;
  const remainingUrls = totalUrls - analyzedUrls;
  
  // const formatTime = (seconds) => {
  //   const minutes = Math.floor(seconds / 60);
  //   const secs = Math.floor(seconds % 60);
  //   return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  // };

  return (
    <div className="md:fixed md:right-4 right-0 md:top-24 top-0 md:w-72 w-full p-6 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-lg z-10 md:max-h-[calc(100vh-6rem)] max-h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Analysis Progress</h2>
      <div className="mb-4">
        <div className="relative w-full bg-gray-300 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-4 rounded-full transition-all duration-500 ease-in-out ${
              isLoading ? 'animate-pulse' : ''
            }`}
            style={{
              width: `${progressPercentage}%`,
              background: isLoading
                ? 'linear-gradient(90deg, #3B82F6, #60A5FA, #3B82F6)'
                : 'linear-gradient(90deg, #10B981, #34D399, #10B981)',
              backgroundSize: '200% 100%',
              animation: isLoading ? 'gradientMove 2s linear infinite' : 'none',
            }}
          ></div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          Analyzed: {analyzedUrls}/{totalUrls} URLs ({Math.round(progressPercentage)}% complete)
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Remaining: {remainingUrls} URLs
        </p>

      </div>
    </div>
  );
};

export default ProgressSidebar;