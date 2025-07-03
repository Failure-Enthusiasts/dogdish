import { toSlug, isValidMenu } from '../utils/menuHelpers';

describe('toSlug', () => {
  test('converts restaurant name to slug format', () => {
    expect(toSlug('Olive & Basil')).toBe('olive-and-basil');
    expect(toSlug('Thai Kitchen')).toBe('thai-kitchen');
    expect(toSlug('Joe\'s Diner')).toBe('joes-diner');
    expect(toSlug('Café & Bistro')).toBe('cafe-and-bistro');
  });

  test('handles special characters and spaces', () => {
    expect(toSlug('   Olive   &   Basil   ')).toBe('olive-and-basil');
    expect(toSlug('Olive&&Basil')).toBe('olive-and-basil');
    // expect(toSlug('olive-and-basil')).toBe('olive-and-basil');
  });
});

describe('isValidMenu', () => {
  const sampleMenus = [
    {
      caterer: "Olive & Basil",
      event_date: "Monday, March 17",
      event_date_iso: "2025-03-17",
      menu_items: []
    }
  ];
  test('validates correct menu combinations', () => {
    const menusWithCuisine = sampleMenus.map(menu => ({ ...menu, cuisine: 'italian' }));
    return expect(isValidMenu('2025-03-17', 'olive-and-basil', menusWithCuisine)).toBe(true);
  });

  test('rejects invalid date', () => {
    const menusWithCuisine = sampleMenus.map(menu => ({ ...menu, cuisine: 'italian' }));
    expect(isValidMenu('2025-03-18', 'olive-and-basil', menusWithCuisine)).toBe(false);
  });
  test('rejects invalid restaurant', () => {
    const menusWithCuisine = sampleMenus.map(menu => ({ ...menu, cuisine: 'italian' }));
    expect(isValidMenu('2025-03-17', 'wrong-restaurant', menusWithCuisine)).toBe(false);
  });

  test('rejects invalid date format', () => {
    const menusWithCuisine = sampleMenus.map(menu => ({ ...menu, cuisine: 'italian' }));
    expect(isValidMenu('17-03-2025', 'olive-and-basil', menusWithCuisine)).toBe(false);
  });
}); 