# Comprehensive Error Handling System

This document outlines the comprehensive error handling system implemented across the Cater Me Up application.

## Overview

The error handling system provides:
- **Consistent error responses** across all API routes
- **User-friendly error displays** with retry mechanisms
- **Comprehensive logging** for debugging and monitoring
- **Type-safe error handling** with TypeScript
- **Global error boundaries** to catch React errors
- **Graceful degradation** with fallback options

## Architecture

### 1. Error Types (`src/types/errors.ts`)

```typescript
// Core error interfaces
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface ComponentError {
  message: string;
  componentName: string;
  stack?: string;
  timestamp: string;
}

// Standardized API response
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}
```

### 2. Error Utilities (`src/utils/errorUtils.ts`)

**Core Functions:**
- `createErrorResponse()` - Creates standardized error responses
- `createSuccessResponse()` - Creates standardized success responses
- `validateRequiredFields()` - Validates form/API data
- `handleApiResponse()` - Processes fetch responses with error handling
- `retryAsync()` - Retry mechanism for failed operations
- `logError()` - Centralized error logging

**Custom Error Class:**
```typescript
class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCodes;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
}
```

### 3. API Utilities (`src/utils/apiUtils.ts`)

Server-side utilities for Next.js API routes:
- `createApiErrorResponse()` - NextResponse wrapper for errors
- `createApiSuccessResponse()` - NextResponse wrapper for success
- `handleApiError()` - Centralized API error handler
- `validateHttpMethod()` - HTTP method validation
- `parseRequestBody()` - Safe request body parsing

### 4. React Error Boundary (`src/components/ErrorBoundary.tsx`)

Catches JavaScript errors anywhere in the component tree:
- **Automatic error catching** for unhandled React errors
- **User-friendly error display** with retry options
- **Development mode details** for debugging
- **Customizable fallback UI**

### 5. Error Handling Hook (`src/hooks/useErrorHandler.ts`)

Custom React hook for component-level error handling:
- `error` - Current error state
- `isError` - Boolean error flag
- `clearError()` - Reset error state
- `handleError()` - Handle errors manually
- `handleAsyncError()` - Wrapper for async operations

### 6. UI Components

**LoadingSpinner** (`src/components/LoadingSpinner.tsx`):
- Consistent loading states
- Full-screen and inline variants
- Customizable size and messages

**ErrorDisplay** (`src/components/ErrorDisplay.tsx`):
- User-friendly error messages
- Retry and dismiss actions
- Multiple display variants (inline, card, fullscreen)
- Development mode error details

## Implementation Examples

### API Route Error Handling

```typescript
// src/app/api/availableCuisine/route.ts
export async function GET(request: NextRequest) {
  try {
    // Validate and process request
    const data = await fetchMenuData();
    
    if (!data || data.length === 0) {
      return createApiErrorResponse(
        'No available cuisines found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.MENU_NOT_FOUND
      );
    }

    return createApiSuccessResponse(data, 'Successfully fetched cuisines');
  } catch (error) {
    return handleApiError(error, 'GET /api/availableCuisine');
  }
}
```

### Component Error Handling

```typescript
// Page component with comprehensive error handling
function HomePage() {
  const { error, isError, clearError, handleAsyncError } = useErrorHandler();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    handleAsyncError(async () => {
      setLoading(true);
      const result = await retryAsync(fetchData, 3, 1000);
      setData(result);
      setLoading(false);
    }, 'Loading page data');
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (isError && error) {
    return (
      <ErrorDisplay
        error={error}
        variant="fullscreen"
        onRetry={() => {
          clearError();
          loadData();
        }}
      />
    );
  }

  return <div>{/* Page content */}</div>;
}

// Wrap with error boundary
export default function Page() {
  return (
    <ErrorBoundary onError={(error) => console.error('Page error:', error)}>
      <HomePage />
    </ErrorBoundary>
  );
}
```

## Error Codes

Standardized error codes for consistent error handling:

- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `INTERNAL_ERROR` - Server error
- `NETWORK_ERROR` - Network connectivity issues
- `TIMEOUT_ERROR` - Request timeout
- `MENU_NOT_FOUND` - Menu-specific not found
- `AUTHENTICATION_FAILED` - Login failure
- `FILE_NOT_FOUND` - File system error
- `INVALID_REQUEST` - Malformed request

## HTTP Status Codes

All API responses use appropriate HTTP status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `422` - Unprocessable Entity
- `500` - Internal Server Error
- `503` - Service Unavailable

## Best Practices

### 1. API Routes
- Always wrap route handlers in try-catch
- Use standardized response functions
- Log errors with context
- Validate input data
- Return appropriate HTTP status codes

### 2. Components
- Use error boundaries for error isolation
- Implement loading states
- Provide retry mechanisms
- Show user-friendly error messages
- Handle network errors gracefully

### 3. Error Messages
- Be specific but user-friendly
- Provide actionable guidance
- Include error codes for debugging
- Log technical details separately

### 4. Development vs Production
- Show detailed errors in development
- Log errors to monitoring services in production
- Sanitize error messages for users
- Include error tracking/reporting

## Monitoring and Logging

### Error Logging Format
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "context": "API Route or Component Name",
  "message": "Error description",
  "stack": "Error stack trace",
  "status": 500,
  "code": "INTERNAL_ERROR"
}
```

### Integration Points
- Console logging (development)
- Error reporting services (production)
- DataDog integration (already configured)
- Custom error tracking

## Testing Error Handling

### Unit Tests
- Test error boundary behavior
- Test error hook functionality
- Test API error responses
- Test validation functions

### Integration Tests
- Test complete error flows
- Test retry mechanisms
- Test fallback behaviors
- Test user interactions with errors

## Future Enhancements

1. **Error Analytics Dashboard** - Track error patterns and frequency
2. **User Error Reporting** - Allow users to report issues
3. **Offline Error Handling** - Handle network connectivity issues
4. **Error Recovery Suggestions** - AI-powered error resolution hints
5. **Performance Monitoring** - Track error impact on performance

## Migration Guide

For existing components without error handling:

1. **Add Error Boundary**: Wrap components with `<ErrorBoundary>`
2. **Add Loading States**: Replace basic loading with `<LoadingSpinner>`
3. **Add Error Displays**: Replace basic error messages with `<ErrorDisplay>`
4. **Use Error Hook**: Replace try-catch with `useErrorHandler`
5. **Update API Calls**: Use `handleApiResponse` for fetch operations

This comprehensive error handling system ensures a robust, user-friendly application with excellent developer experience and debugging capabilities.