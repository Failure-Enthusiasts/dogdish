export const toSlug = (str: string): string => {
  // 1. Trim whitespace and convert to lowercase
  let slug = str.trim().toLowerCase();
  
  // 2. Normalize accented characters (e.g. é -> e)
  slug = slug.normalize('NFD').replace(/[̀-ͯ]/g, '');
  
  // 3. Replace one or more ampersands (&) with " and " (note the spaces)
  slug = slug.replace(/&+/g, ' and ');

  // 4. Trim again to remove leading/trailing spaces introduced by " and "
  slug = slug.trim();

  // 5. Replace multiple whitespace characters (including those from " and ") with a single hyphen
  slug = slug.replace(/\s+/g, '-');
  
  // 6. Remove any characters that are not lowercase alphanumeric or hyphens
  slug = slug.replace(/[^a-z0-9-]/g, '');
  
  // 7. Consolidate multiple hyphens into a single hyphen
  slug = slug.replace(/-+/g, '-');
  
  // 8. Remove leading or trailing hyphens (e.g. "-foo-" -> "foo")
  slug = slug.replace(/^-+|-+$/g, '');

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