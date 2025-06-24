'use client';
import { useState, useCallback } from 'react';
import { ApiError } from '@/types/errors';
import { logError } from '@/utils/errorUtils';

interface UseErrorHandlerOptions {
  onError?: (error: ApiError) => void;
  showToast?: boolean;
}

interface UseErrorHandlerReturn {
  error: ApiError | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ) => Promise<T | null>;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      let apiError: ApiError;

      if (error && typeof error === 'object' && 'status' in error) {
        // It's already an ApiError
        apiError = error as ApiError;
      } else if (error instanceof Error) {
        apiError = {
          message: error.message,
          status: 500,
          timestamp: new Date().toISOString()
        };
      } else if (typeof error === 'string') {
        apiError = {
          message: error,
          status: 500,
          timestamp: new Date().toISOString()
        };
      } else {
        apiError = {
          message: 'An unexpected error occurred',
          status: 500,
          timestamp: new Date().toISOString()
        };
      }

      // Log the error
      logError(error as Error, context);

      // Set the error state
      setError(apiError);

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(apiError);
      }
    },
    [options]
  );

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        clearError();
        return await asyncFn();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [clearError, handleError]
  );

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    handleAsyncError
  };
}