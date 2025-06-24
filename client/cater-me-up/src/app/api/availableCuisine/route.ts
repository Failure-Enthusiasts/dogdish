import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AvailableCuisineSchema, SearchQuerySchema, formatValidationError } from '../../../lib/validation';
import { 
  checkRateLimit, 
  getRateLimitKey, 
  createRateLimitedResponse, 
  addSecurityHeaders,
  addCorsHeaders,
  RATE_LIMITS 
} from '../../../lib/security';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, ':available-cuisine');
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.api);
  
  if (!rateLimit.allowed) {
    return createRateLimitedResponse(rateLimit.resetTime);
  }

  try {
    // Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    let validatedQuery;
    try {
      validatedQuery = SearchQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Invalid query parameters',
          details: formatValidationError(error)
        }, { status: 400 });
      }
      throw error;
    }

    // Sample data - in production, fetch from database with proper filtering
    const allMenus = [
      {
        cuisineSlug: 'olive-and-basil',
        dateSlug: '2025-03-17',
        cuisineName: 'Olive & Basil',
        eventDate: 'Monday, March 17'
      },
      {
        cuisineSlug: 'thai-kitchen',
        dateSlug: '2025-03-18',
        cuisineName: 'Thai Kitchen',
        eventDate: 'Tuesday, March 18'
      },
      {
        cuisineSlug: 'italian-bistro',
        dateSlug: '2025-03-19',
        cuisineName: 'Italian Bistro',
        eventDate: 'Wednesday, March 19'
      }
    ];

    // Validate each menu item
    const validatedMenus = [];
    for (const menu of allMenus) {
      try {
        const validatedMenu = AvailableCuisineSchema.parse(menu);
        
        // Apply search filter if provided
        if (validatedQuery.q) {
          const searchTerm = validatedQuery.q.toLowerCase();
          if (!validatedMenu.cuisineName.toLowerCase().includes(searchTerm)) {
            continue; // Skip this menu if it doesn't match search
          }
        }
        
        validatedMenus.push(validatedMenu);
      } catch (error) {
        console.error('Invalid menu data:', menu, error);
        // Skip invalid menu items instead of failing the entire request
        continue;
      }
    }

    // Apply pagination
    const page = Number(validatedQuery.page) - 1; // Convert to 0-based
    const limit = Number(validatedQuery.limit);
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    
    const paginatedMenus = validatedMenus.slice(startIndex, endIndex);

    // Create response
    const response = NextResponse.json({
      success: true,
      data: paginatedMenus,
      pagination: {
        page: page + 1, // Convert back to 1-based
        limit,
        total: validatedMenus.length,
        hasMore: endIndex < validatedMenus.length
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

    // Add security headers
    addSecurityHeaders(response);
    
    // Add CORS headers
    const origin = request.headers.get('origin');
    addCorsHeaders(response, origin);

    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Error fetching available cuisines:', error);
    
    const errorResponse = NextResponse.json({ 
      error: 'Internal server error. Please try again later.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    return addSecurityHeaders(errorResponse);
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  
  const origin = request.headers.get('origin');
  addCorsHeaders(response, origin);
  addSecurityHeaders(response);
  
  return response;
} 