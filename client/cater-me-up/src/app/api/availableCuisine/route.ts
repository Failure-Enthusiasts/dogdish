import { createApiSuccessResponse, createApiErrorResponse, handleApiError } from '@/utils/apiUtils';
import { HttpStatus, ErrorCodes } from '@/types/errors';

interface Menu {
  cuisineSlug: string;
  dateSlug: string;
  cuisineName: string;
  eventDate: string;
}

export async function GET() {
  try {
    // Log the incoming request
    console.log('[API] GET /api/availableCuisine - Fetching available cuisines');

    // Here you would typically fetch the data from your database or other source
    // For now, we're using mock data but with proper error handling
    const menus: Menu[] = [
      {
        cuisineSlug: 'moroccan',
        dateSlug: '2025-05-12',
        cuisineName: 'Moroccan',
        eventDate: 'Monday, May 12, 2025'
      },
      // In the future, add more menus from database
    ];

    // Validate that we have data
    if (!menus || menus.length === 0) {
      return createApiErrorResponse(
        'No available cuisines found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.MENU_NOT_FOUND
      );
    }

    // Validate menu structure
    const validMenus = menus.filter(menu => 
      menu.cuisineSlug && 
      menu.dateSlug && 
      menu.cuisineName && 
      menu.eventDate
    );

    if (validMenus.length === 0) {
      return createApiErrorResponse(
        'No valid menu data available',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.INTERNAL_ERROR,
        { originalCount: menus.length, validCount: validMenus.length }
      );
    }

    console.log(`[API] Successfully fetched ${validMenus.length} available cuisines`);
    
    return createApiSuccessResponse(
      validMenus,
      `Found ${validMenus.length} available cuisine${validMenus.length === 1 ? '' : 's'}`,
      HttpStatus.OK
    );

  } catch (error) {
    console.error('[API] Error in GET /api/availableCuisine:', error);
    return handleApiError(error, 'GET /api/availableCuisine');
  }
} 