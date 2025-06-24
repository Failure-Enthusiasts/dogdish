import { ApiError, ApiResponse, ErrorCodes, HttpStatus, ValidationError } from '@/types/errors';

// Create a standardized API error response (for server-side use)
export function createErrorResponse(
  message: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: ErrorCodes,
  details?: Record<string, unknown>
): ApiResponse {
  const error: ApiError = {
    message,
    status,
    code,
    details,
    timestamp: new Date().toISOString()
  };

  const response: ApiResponse = {
    success: false,
    error,
    message
  };

  return response;
}

// Create a success response (for server-side use)
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };

  return response;
}

// Validate required fields
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
        value: data[field]
      });
    }
  }

  return errors;
}

// Log errors with consistent format
export function logError(error: Error | ApiError, context?: string): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    context,
    message: error.message,
    stack: 'stack' in error ? error.stack : undefined,
    ...('status' in error ? { status: error.status, code: error.code } : {})
  };

  console.error('[ERROR]', JSON.stringify(logData, null, 2));
}

// Parse and handle API errors from fetch responses
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: response.status,
      code: getErrorCodeFromStatus(response.status),
      timestamp: new Date().toISOString()
    };

    throw apiError;
  }

  try {
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    logError(error as Error, 'JSON parsing error');
    throw new Error('Failed to parse response');
  }
}

// Get error code based on HTTP status
export function getErrorCodeFromStatus(status: number): ErrorCodes {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCodes.VALIDATION_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCodes.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCodes.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCodes.NOT_FOUND;
    case HttpStatus.METHOD_NOT_ALLOWED:
      return ErrorCodes.INVALID_REQUEST;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}

// Create custom error class for application errors
export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCodes;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCodes = ErrorCodes.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Retry utility for failed requests
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        logError(lastError, `Failed after ${maxRetries} retries`);
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
}