import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  getRateLimitKey, 
  createRateLimitedResponse, 
  addSecurityHeaders,
  addCorsHeaders,
  validateOrigin,
  RATE_LIMITS 
} from '../../lib/security';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Apply rate limiting based on route type
  let rateLimitConfig = RATE_LIMITS.general;
  let rateLimitSuffix = '';

  if (pathname.startsWith('/api')) {
    rateLimitConfig = RATE_LIMITS.api;
    rateLimitSuffix = ':api';
  } else if (pathname.startsWith('/admin/login')) {
    rateLimitConfig = RATE_LIMITS.auth;
    rateLimitSuffix = ':auth';
  }

  // Check rate limits
  const rateLimitKey = getRateLimitKey(request, rateLimitSuffix);
  const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);
  
  if (!rateLimit.allowed) {
    return createRateLimitedResponse(rateLimit.resetTime);
  }

  // Validate suspicious request patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // Script injection
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    /vbscript:/i, // VBScript protocol
    /%3C%73%63%72%69%70%74/i, // URL encoded script
  ];

  const fullPath = pathname + request.nextUrl.search;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullPath)) {
      console.warn('Suspicious request blocked:', fullPath);
      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { status: 400 }
      );
    }
  }

  // Validate origin for sensitive operations
  if (pathname.startsWith('/api') && !validateOrigin(origin)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }

  // Admin authentication check
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !isAuthenticated) {
    // Check for session timeout (24 hours)
    const loginTime = request.cookies.get('loginTime')?.value;
    if (loginTime) {
      const now = Date.now();
      const sessionAge = now - parseInt(loginTime);
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxSessionAge) {
        // Session expired, clear cookies
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('isAuthenticated');
        response.cookies.delete('loginTime');
        return response;
      }
    }
    
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Validate URL parameters for dynamic routes
  if (pathname.match(/^\/\d{4}-\d{2}-\d{2}\/[a-z0-9-]+$/)) {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length === 2) {
      const [dateSlug, cuisineSlug] = pathParts;
      
      // Basic validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateSlug) || !/^[a-z0-9-]+$/.test(cuisineSlug)) {
        return NextResponse.redirect(new URL('/404', request.url));
      }
      
      // Validate date is reasonable
      const date = new Date(dateSlug);
      if (isNaN(date.getTime())) {
        return NextResponse.redirect(new URL('/404', request.url));
      }
    }
  }

  // Create response and add security headers
  const response = NextResponse.next();
  
  addSecurityHeaders(response);
  
  if (pathname.startsWith('/api')) {
    addCorsHeaders(response, origin);
  }

  // Add additional security headers based on route
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/((?!_next|static|favicon.ico).*)',
  ],
};