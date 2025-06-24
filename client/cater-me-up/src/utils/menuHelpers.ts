export const toSlug = (str: string): string => {
  // Input validation and sanitization
  if (typeof str !== 'string' || str.length === 0) {
    throw new Error('Invalid input for slug conversion');
  }
  
  // Limit input length to prevent DoS
  if (str.length > 200) {
    throw new Error('Input too long for slug conversion');
  }
  
  // First, sanitize by removing potentially dangerous characters
  const sanitized = str
    .trim()
    .replace(/[<>"/\\]/g, '') // Remove dangerous characters
    .toLowerCase();
  
  // Convert to slug format
  const slug = sanitized
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/&/g, 'and')           // Replace & with 'and'
    .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  // Final validation
  if (slug.length === 0 || slug.length > 100) {
    throw new Error('Invalid slug generated');
  }
  
  return slug;
};

export const isValidMenu = (dateSlug: string, cuisineSlug: string, availableMenus: Menu[]): boolean => {
  try {
    return availableMenus.some(menu => {
      try {
        const menuSlug = toSlug(menu.caterer || menu.cuisine || '');
        return menu.event_date_iso === dateSlug && menuSlug === cuisineSlug;
      } catch (error) {
        console.error('Error processing menu:', menu, error);
        return false;
      }
    });
  } catch (error) {
    console.error('Error validating menu:', error);
    return false;
  }
};

export type Menu = {
  caterer?: string;
  cuisine?: string;
  event_date: string;
  event_date_iso: string;
  menu_items: Array<{
    title: string;
    description: string;
    preferences: string[];
    allergens: string[];
  }>;
}; 