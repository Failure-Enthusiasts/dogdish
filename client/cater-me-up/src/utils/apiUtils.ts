import { NextResponse } from 'next/server';
import { ApiResponse, ErrorCodes, HttpStatus } from '@/types/errors';
import { createErrorResponse, createSuccessResponse } from './errorUtils';

// Create a NextResponse with error handling
export function createApiErrorResponse(
  message: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: ErrorCodes,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  const response = createErrorResponse(message, status, code, details);
  return NextResponse.json(response, { status });
}

// Create a NextResponse with success data
export function createApiSuccessResponse<T>(
  data: T,
  message?: string,
  status: HttpStatus = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  const response = createSuccessResponse(data, message);
  return NextResponse.json(response, { status });
}

// Handle API route errors with proper logging
export function handleApiError(error: unknown, context?: string): NextResponse<ApiResponse> {
  console.error(`[API ERROR] ${context || 'Unknown context'}:`, error);

  if (error instanceof Error) {
    return createApiErrorResponse(
      'An internal server error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCodes.INTERNAL_ERROR,
      { originalMessage: error.message }
    );
  }

  return createApiErrorResponse(
    'An unexpected error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCodes.INTERNAL_ERROR
  );
}

// Validate HTTP method
export function validateHttpMethod(
  request: Request,
  allowedMethods: string[]
): NextResponse<ApiResponse> | null {
  if (!allowedMethods.includes(request.method)) {
    return createApiErrorResponse(
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      HttpStatus.METHOD_NOT_ALLOWED,
      ErrorCodes.INVALID_REQUEST,
      { allowedMethods, receivedMethod: request.method }
    );
  }
  return null;
}

// Parse request body with error handling
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new Error('Invalid JSON in request body');
  }
}