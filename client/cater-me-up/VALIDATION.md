# Input Validation System

This document outlines the comprehensive input validation system implemented throughout the CaterMeUp application to ensure security, data integrity, and user experience.

## Overview

The validation system includes:
- **Schema-based validation** using Zod
- **Input sanitization** using validator.js
- **Rate limiting** for API endpoints
- **Security headers** and CORS protection
- **URL parameter validation** against injection attacks
- **Frontend form validation** with real-time feedback

## Architecture

### Core Validation Library (`src/lib/validation.ts`)

Contains Zod schemas and validation utilities for all data types:

```typescript
// Menu data validation
const menuData = validateMenuData(requestBody);

// Admin login validation
const loginData = validateAdminLogin(formData);

// URL parameter validation
const { dateSlug, cuisineSlug } = validateCuisineParams(params);
```

### Security Middleware (`src/lib/security.ts`)

Provides security utilities including:
- Rate limiting with configurable windows
- Security header injection
- CORS validation
- Request pattern detection for suspicious activity

### Frontend Validation Hooks (`src/hooks/useValidation.ts`)

React hooks for form validation:
- `useValidation()` - Full form validation
- `useFieldValidation()` - Real-time field validation with debouncing

## Validation Rules

### Menu Data
- **Caterer name**: 1-100 characters, sanitized
- **Event dates**: Valid ISO date format (YYYY-MM-DD), future dates only
- **Menu items**: 1-50 items maximum
- **Item titles**: 1-200 characters, sanitized
- **Descriptions**: 1-1000 characters, sanitized  
- **Preferences**: Enum validation (VEGAN, VEGETARIAN, etc.)
- **Allergens**: Array of sanitized strings, max 50 characters each

### Admin Login
- **Username**: 1-50 characters, alphanumeric + hyphens/underscores only
- **Password**: 8-128 characters, must contain uppercase, lowercase, and number

### URL Parameters
- **Date slugs**: YYYY-MM-DD format, valid dates within 1 year range
- **Cuisine slugs**: Lowercase alphanumeric + hyphens, 1-100 characters
- **Suspicious pattern detection**: Blocks directory traversal, script injection

## Security Features

### Rate Limiting
- **API endpoints**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes  
- **General requests**: 200 requests per 15 minutes

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` with restricted sources
- `Referrer-Policy: strict-origin-when-cross-origin`

### Input Sanitization
All string inputs are sanitized to:
- Escape HTML entities (`<`, `>`, `&`, `"`, `'`)
- Trim whitespace
- Remove potentially dangerous characters
- Limit length to prevent DoS attacks

### CORS Protection
- Origin validation against allowlist
- Proper CORS headers for API endpoints
- Preflight request handling

## API Endpoint Validation

### POST /api/menu/update
```typescript
// Request validation
- Content-Type: application/json required
- Body: Full MenuDataSchema validation
- Business rules: No past event updates
- File operations: Atomic writes with backups
- Response: Sanitized success/error messages
```

### GET /api/availableCuisine
```typescript
// Query parameter validation
- Search query: Max 100 characters, sanitized
- Pagination: Page 1-1000, limit 1-100
- Response: Validated menu arrays with metadata
```

## Frontend Validation

### Real-time Validation
```typescript
// Usage in components
const { validate, hasError, getError } = useValidation(AdminLoginSchema);

const handleSubmit = (formData) => {
  const result = validate(formData);
  if (result.isValid) {
    // Process validated data
    processLogin(result.data);
  }
};
```

### Field-level Validation
```typescript
// Real-time field validation with debouncing
const { validateField, hasFieldError } = useFieldValidation(schema, 300);

const handleFieldChange = (field, value) => {
  validateField(field, value);
};
```

## Error Handling

### Client-side Errors
- Field-specific error messages
- Form-level validation summaries  
- Rate limiting notifications with retry timing
- Session timeout handling

### Server-side Errors
- Structured error responses with codes
- Validation error details for debugging
- Generic error messages to prevent information leakage
- Proper HTTP status codes

## Testing Validation

### Unit Tests
```typescript
// Example validation tests
describe('MenuDataSchema', () => {
  test('validates correct menu data', () => {
    const validMenu = { /* valid data */ };
    expect(() => validateMenuData(validMenu)).not.toThrow();
  });
  
  test('rejects invalid menu data', () => {
    const invalidMenu = { /* invalid data */ };
    expect(() => validateMenuData(invalidMenu)).toThrow();
  });
});
```

### Integration Tests
- API endpoint validation testing
- Rate limiting behavior
- Security header verification
- CORS functionality

## Configuration

### Rate Limits
```typescript
const RATE_LIMITS = {
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  general: { windowMs: 15 * 60 * 1000, max: 200 }
};
```

### Allowed Origins
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  // Add production domains
];
```

## Security Considerations

### Production Deployment
1. **Environment Variables**: Store sensitive configuration in env vars
2. **Rate Limiting**: Use Redis for distributed rate limiting
3. **Session Management**: Implement secure session storage
4. **HTTPS**: Enforce HTTPS in production
5. **Database Validation**: Add database-level constraints
6. **Audit Logging**: Log security events and validation failures

### Monitoring
- Track validation failure rates
- Monitor suspicious request patterns  
- Alert on rate limit violations
- Audit admin access attempts

## Future Enhancements

### Planned Improvements
- [ ] Database-backed rate limiting with Redis
- [ ] Advanced bot detection
- [ ] IP geolocation blocking
- [ ] Webhook validation for external integrations
- [ ] File upload validation
- [ ] Multi-factor authentication
- [ ] CAPTCHA integration for suspicious activity

### Schema Evolution
- Version validation schemas for API compatibility
- Backward compatibility handling
- Schema migration utilities
- Dynamic validation rule updates

## Usage Examples

### Basic Form Validation
```typescript
import { useValidation } from '../hooks/useValidation';
import { AdminLoginSchema } from '../lib/validation';

function LoginForm() {
  const { validate, hasError, getError } = useValidation(AdminLoginSchema);
  
  const handleSubmit = (formData) => {
    const result = validate(formData);
    if (result.isValid) {
      login(result.data);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        className={hasError('username') ? 'error' : ''}
      />
      {hasError('username') && (
        <span className="error">{getError('username')}</span>
      )}
    </form>
  );
}
```

### API Endpoint Validation
```typescript
// In API route handler
export default async function handler(req, res) {
  try {
    const validatedData = validateMenuData(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(error)
      });
    }
  }
}
```

This validation system provides comprehensive security and data integrity while maintaining good user experience through clear error messages and real-time feedback.