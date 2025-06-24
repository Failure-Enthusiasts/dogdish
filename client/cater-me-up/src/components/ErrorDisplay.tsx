'use client';
import React from 'react';
import { ApiError } from '@/types/errors';

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'card' | 'fullscreen';
  showDetails?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  variant = 'card',
  showDetails = false
}) => {
  const baseClasses = "flex items-start space-x-3";
  
  const variantClasses = {
    inline: "p-4 bg-red-50 border border-red-200 rounded-md",
    card: "p-6 bg-white border border-red-200 rounded-lg shadow-sm",
    fullscreen: "min-h-screen bg-gray-50 flex items-center justify-center px-4"
  };

  const iconClasses = {
    inline: "h-5 w-5 text-red-400 mt-0.5",
    card: "h-6 w-6 text-red-500 mt-0.5",
    fullscreen: "h-12 w-12 text-red-500"
  };

  const content = (
    <div className={variant === 'fullscreen' ? 'max-w-md w-full text-center' : ''}>
      <div className={variant === 'fullscreen' ? 'mb-4' : baseClasses}>
        <svg 
          className={iconClasses[variant]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        
        <div className={variant === 'fullscreen' ? '' : 'flex-1'}>
          <h3 className={`font-semibold ${
            variant === 'fullscreen' 
              ? 'text-xl text-gray-900 mb-2' 
              : 'text-red-800 text-sm'
          }`}>
            {variant === 'fullscreen' ? 'Something went wrong' : 'Error'}
          </h3>
          
          <p className={`${
            variant === 'fullscreen' 
              ? 'text-gray-600 mb-4' 
              : 'text-red-700 text-sm mt-1'
          }`}>
            {error.message}
          </p>

          {showDetails && (error.code || error.details) && (
            <details className={`mt-2 ${variant === 'fullscreen' ? 'text-left' : ''}`}>
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Error Details
              </summary>
              <div className="mt-1 text-xs bg-gray-100 p-2 rounded">
                {error.code && <p><strong>Code:</strong> {error.code}</p>}
                {error.details && (
                  <pre className="mt-1 overflow-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                )}
                <p className="mt-1"><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</p>
              </div>
            </details>
          )}

          {(onRetry || onDismiss) && (
            <div className={`${
              variant === 'fullscreen' 
                ? 'space-y-2' 
                : 'flex space-x-2 mt-3'
            }`}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`${
                    variant === 'fullscreen'
                      ? 'w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800'
                      : 'bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700'
                  } transition-colors`}
                >
                  Try Again
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`${
                    variant === 'fullscreen'
                      ? 'w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300'
                      : 'bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300'
                  } transition-colors`}
                >
                  {variant === 'fullscreen' ? 'Go Home' : 'Dismiss'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className={variantClasses[variant]}>
        <div className="bg-white rounded-lg shadow-md p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={variantClasses[variant]}>
      {content}
    </div>
  );
};

export default ErrorDisplay;