import { logError } from './errorUtils';

export const toSlug = (str: string): string => {
  try {
    if (!str || typeof str !== 'string') {
      logError(new Error(`Invalid input for toSlug: ${typeof str}`), 'toSlug validation');
      return '';
    }

    // First, trim whitespace and convert to lowercase
    let slug = str.trim().toLowerCase();
    
    // Replace '&' with 'and'
    slug = slug.replace(/&/g, 'and');
    
    // Replace multiple spaces with single dash
    slug = slug.replace(/\s+/g, '-');
    
    // Remove any non-alphanumeric characters (except dashes)
    slug = slug.replace(/[^a-z0-9-]/g, '');
    
    // Remove multiple consecutive dashes
    slug = slug.replace(/-+/g, '-');
    
    // Remove leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, '');
    
    return slug;
  } catch (error) {
    logError(error as Error, 'toSlug conversion');
    return '';
  }
};

export const isValidMenu = (dateSlug: string, cuisineSlug: string, availableMenus: Menu[]): boolean => {
  try {
    // Validate inputs
    if (!dateSlug || !cuisineSlug) {
      console.warn('isValidMenu: Missing required parameters', { dateSlug, cuisineSlug });
      return false;
    }

    if (!Array.isArray(availableMenus) || availableMenus.length === 0) {
      console.warn('isValidMenu: Invalid or empty availableMenus array');
      return false;
    }

    // Check if any menu matches the criteria
    return availableMenus.some(menu => {
      try {
        if (!menu || !menu.cuisine || !menu.event_date_iso) {
          console.warn('isValidMenu: Invalid menu structure', menu);
          return false;
        }

        const menuSlug = toSlug(menu.cuisine);
        const isMatch = menu.event_date_iso === dateSlug && menuSlug === cuisineSlug;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Menu validation:', {
            menuCuisine: menu.cuisine,
            menuSlug,
            menuDate: menu.event_date_iso,
            requestedDate: dateSlug,
            requestedCuisine: cuisineSlug,
            isMatch
          });
        }
        
        return isMatch;
      } catch (error) {
        logError(error as Error, `Menu validation for ${menu?.cuisine || 'unknown'}`);
        return false;
      }
    });
  } catch (error) {
    logError(error as Error, 'isValidMenu');
    return false;
  }
};

// Helper function to validate menu data structure
export const validateMenuData = (menu: Menu): string[] => {
  const errors: string[] = [];

  try {
    if (!menu) {
      errors.push('Menu data is null or undefined');
      return errors;
    }

    if (!menu.cuisine || typeof menu.cuisine !== 'string') {
      errors.push('Cuisine name is required and must be a string');
    }

    if (!menu.event_date || typeof menu.event_date !== 'string') {
      errors.push('Event date is required and must be a string');
    }

    if (!menu.event_date_iso || typeof menu.event_date_iso !== 'string') {
      errors.push('Event date ISO is required and must be a string');
    }

    if (!Array.isArray(menu.menu_items)) {
      errors.push('Menu items must be an array');
    } else if (menu.menu_items.length === 0) {
      errors.push('Menu must have at least one item');
    } else {
      // Validate each menu item
      menu.menu_items.forEach((item, index) => {
        if (!item.title || typeof item.title !== 'string') {
          errors.push(`Menu item ${index + 1}: Title is required and must be a string`);
        }
        
        if (!item.description || typeof item.description !== 'string') {
          errors.push(`Menu item ${index + 1}: Description is required and must be a string`);
        }
        
        if (!Array.isArray(item.preferences)) {
          errors.push(`Menu item ${index + 1}: Preferences must be an array`);
        }
        
        if (!Array.isArray(item.allergens)) {
          errors.push(`Menu item ${index + 1}: Allergens must be an array`);
        }
      });
    }
  } catch (error) {
    logError(error as Error, 'validateMenuData');
    errors.push('Unexpected error during menu validation');
  }

  return errors;
};

export type Menu = {
  cuisine: string;
  event_date: string;
  event_date_iso: string;
  menu_items: Array<{
    title: string;
    description: string;
    preferences: string[];
    allergens: string[];
  }>;
}; 