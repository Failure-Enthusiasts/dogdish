'use client';
import React from 'react';
import { useHealthCheck } from '@/hooks/useHealthCheck';

interface HealthCheckProps {
  endpoint: string;
  serviceName: string;
  serviceUrl?: string;
  showDetails?: boolean;
  className?: string;
}

const HealthCheck: React.FC<HealthCheckProps> = ({ 
  endpoint,
  serviceName,
  serviceUrl,
  showDetails = true, 
  className = '' 
}) => {
  const { status, checkHealth, isChecking } = useHealthCheck({ 
    endpoint, 
    serviceName 
  });

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (isChecking) return 'bg-yellow-500';
    return status.isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    return status.isOnline ? 'Online' : 'Offline';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-300 border-t-yellow-600" />
      );
    }
    
    if (status.isOnline) {
      return (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!showDetails) {
    // Compact view - just status indicator
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className="text-sm text-gray-600">{serviceName}</span>
        <span className={`text-xs font-medium ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{serviceName} Health</h3>
            <p className="text-xs text-gray-500">{serviceUrl || endpoint}</p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
        >
          <svg 
            className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {getStatusText()}
          </span>
        </div>

        {status.version && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Version:</span>
            <span className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
              {status.version}
            </span>
          </div>
        )}

        {status.responseTime !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Response Time:</span>
            <span className={`font-medium ${
              status.responseTime < 1000 ? 'text-green-600' : 
              status.responseTime < 3000 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {status.responseTime}ms
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Last Checked:</span>
          <span className="text-gray-900 text-xs">
            {formatLastChecked(status.lastChecked)}
          </span>
        </div>

        {status.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-medium text-red-800">Error</p>
                <p className="text-xs text-red-700 mt-1">{status.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Automatically checks every minute • Next check in {isChecking ? '...' : '~60s'}
        </p>
      </div>
    </div>
  );
};

export default HealthCheck;
