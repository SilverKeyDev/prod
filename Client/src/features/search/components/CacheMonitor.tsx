/**
 * Cache Monitor Component
 * Displays cache statistics and memory usage for debugging and monitoring
 */

import React, { useState, useEffect } from "react";
import { cacheUtils, memoryUtils } from "../hooks/unifiedCache";

interface CacheMonitorProps {
  showInDevelopment?: boolean;
  refreshInterval?: number;
}

export function CacheMonitor({
  showInDevelopment = true,
  refreshInterval = 5000,
}: CacheMonitorProps) {
  const [stats, setStats] = useState(cacheUtils.getCacheStats());
  const [memoryStats, setMemoryStats] = useState(memoryUtils.getMemoryStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development by default
    if (showInDevelopment && process.env.NODE_ENV !== "development") {
      return;
    }

    const interval = setInterval(() => {
      setStats(cacheUtils.getCacheStats());
      setMemoryStats(memoryUtils.getMemoryStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, showInDevelopment]);

  // Toggle visibility with Ctrl+Shift+C
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "C") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Cache Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-gray-600">Cache Entries:</span>
            <span className="ml-1 text-gray-800">{stats.totalEntries}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Cache Size:</span>
            <span className="ml-1 text-gray-800">
              {(stats.totalSize / 1024).toFixed(1)}KB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-gray-600">Hit Rate:</span>
            <span className="ml-1 text-gray-800">
              {(stats.hitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Miss Rate:</span>
            <span className="ml-1 text-gray-800">
              {(stats.missRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="font-medium text-gray-600 mb-1">Memory Usage:</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Markers:</span>
              <span className="text-gray-800">{memoryStats.markers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Polygons:</span>
              <span className="text-gray-800">{memoryStats.polygons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overlays:</span>
              <span className="text-gray-800">{memoryStats.overlays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Listeners:</span>
              <span className="text-gray-800">{memoryStats.listeners}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timers:</span>
              <span className="text-gray-800">{memoryStats.timers}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium text-gray-600">Total:</span>
              <span className="font-medium text-gray-800">
                {memoryStats.total}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-2">
          <button
            onClick={() => {
              cacheUtils.clearSearchCache();
              setStats(cacheUtils.getCacheStats());
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
          >
            Clear Cache
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Press Ctrl+Shift+C to toggle
      </div>
    </div>
  );
}

export default CacheMonitor;
