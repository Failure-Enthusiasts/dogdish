export const toSlug = (str: string): string => {
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
  
  return slug;
};

export const isValidMenu = (dateSlug: string, cuisineSlug: string, availableMenus: Menu[]): boolean => {
  return availableMenus.some(menu => {
    const menuSlug = toSlug(menu.cuisine);
    return menu.event_date_iso === dateSlug && menuSlug === cuisineSlug;
  });
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