import { 
  MenuDataSchema,
  MenuItemSchema,
  AdminLoginSchema,
  CuisineParamsSchema,
  AvailableCuisineSchema,
  SearchQuerySchema,
  validateMenuData,
  validateAdminLogin,
  validateCuisineParams,
  formatValidationError,
  sanitizeString,
  isValidEmail,
  isValidSlug
} from '../lib/validation';

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    test('escapes HTML entities', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeString('&<>"\'test')).toBe('&amp;&lt;&gt;&quot;&#x27;test');
    });

    test('trims whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });
  });

  describe('isValidEmail', () => {
    test('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidSlug', () => {
    test('validates correct slugs', () => {
      expect(isValidSlug('olive-and-basil')).toBe(true);
      expect(isValidSlug('thai-kitchen-123')).toBe(true);
    });

    test('rejects invalid slugs', () => {
      expect(isValidSlug('Invalid Slug')).toBe(false);
      expect(isValidSlug('slug_with_underscores')).toBe(false);
      expect(isValidSlug('slug@special')).toBe(false);
    });
  });
});

describe('Menu Validation', () => {
  const validMenuItem = {
    title: 'Test Dish',
    description: 'A delicious test dish',
    preferences: ['VEGAN'],
    allergens: ['Nuts']
  };

  const validMenuData = {
    caterer: 'Test Caterer',
    event_date: 'Monday, March 17',
    event_date_iso: '2025-03-17',
    menu_items: [validMenuItem]
  };

  describe('MenuItemSchema', () => {
    test('validates correct menu item', () => {
      expect(() => MenuItemSchema.parse(validMenuItem)).not.toThrow();
    });

    test('rejects empty title', () => {
      const invalidItem = { ...validMenuItem, title: '' };
      expect(() => MenuItemSchema.parse(invalidItem)).toThrow();
    });

    test('rejects title that is too long', () => {
      const invalidItem = { ...validMenuItem, title: 'a'.repeat(201) };
      expect(() => MenuItemSchema.parse(invalidItem)).toThrow();
    });

    test('rejects empty description', () => {
      const invalidItem = { ...validMenuItem, description: '' };
      expect(() => MenuItemSchema.parse(invalidItem)).toThrow();
    });

    test('rejects invalid preferences', () => {
      const invalidItem = { ...validMenuItem, preferences: ['INVALID_PREFERENCE'] };
      expect(() => MenuItemSchema.parse(invalidItem)).toThrow();
    });

    test('sanitizes input strings', () => {
      const itemWithHtml = {
        ...validMenuItem,
        title: '<script>Test</script>',
        description: 'Test & description'
      };
      const result = MenuItemSchema.parse(itemWithHtml);
      expect(result.title).toBe('&lt;script&gt;Test&lt;&#x2F;script&gt;');
      expect(result.description).toBe('Test &amp; description');
    });
  });

  describe('MenuDataSchema', () => {
    test('validates correct menu data', () => {
      expect(() => validateMenuData(validMenuData)).not.toThrow();
    });

    test('rejects empty caterer name', () => {
      const invalidData = { ...validMenuData, caterer: '' };
      expect(() => validateMenuData(invalidData)).toThrow();
    });

    test('rejects invalid date format', () => {
      const invalidData = { ...validMenuData, event_date_iso: '2025/03/17' };
      expect(() => validateMenuData(invalidData)).toThrow();
    });

    test('rejects past dates', () => {
      const invalidData = { ...validMenuData, event_date_iso: '2019-01-01' };
      expect(() => validateMenuData(invalidData)).toThrow();
    });

    test('rejects empty menu items', () => {
      const invalidData = { ...validMenuData, menu_items: [] };
      expect(() => validateMenuData(invalidData)).toThrow();
    });

    test('rejects too many menu items', () => {
      const manyItems = Array(51).fill(validMenuItem);
      const invalidData = { ...validMenuData, menu_items: manyItems };
      expect(() => validateMenuData(invalidData)).toThrow();
    });
  });
});

describe('Admin Login Validation', () => {
  const validLoginData = {
    username: 'admin',
    password: 'Password123'
  };

  describe('AdminLoginSchema', () => {
    test('validates correct login data', () => {
      expect(() => validateAdminLogin(validLoginData)).not.toThrow();
    });

    test('rejects empty username', () => {
      const invalidData = { ...validLoginData, username: '' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects username with invalid characters', () => {
      const invalidData = { ...validLoginData, username: 'admin@test' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects short password', () => {
      const invalidData = { ...validLoginData, password: 'short' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects password without uppercase', () => {
      const invalidData = { ...validLoginData, password: 'password123' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects password without lowercase', () => {
      const invalidData = { ...validLoginData, password: 'PASSWORD123' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects password without number', () => {
      const invalidData = { ...validLoginData, password: 'PasswordABC' };
      expect(() => validateAdminLogin(invalidData)).toThrow();
    });

    test('rejects username with HTML characters', () => {
      const dataWithHtml = { ...validLoginData, username: 'admin<script>' };
      expect(() => validateAdminLogin(dataWithHtml)).toThrow();
    });
  });
});

describe('URL Parameter Validation', () => {
  describe('CuisineParamsSchema', () => {
    test('validates correct cuisine parameters', () => {
      const validParams = { cuisine: ['2025-03-17', 'olive-and-basil'] };
      expect(() => validateCuisineParams(validParams)).not.toThrow();
    });

    test('rejects incorrect number of parameters', () => {
      const invalidParams = { cuisine: ['2025-03-17'] };
      expect(() => validateCuisineParams(invalidParams)).toThrow();
    });

    test('rejects invalid date format', () => {
      const invalidParams = { cuisine: ['2025/03/17', 'olive-and-basil'] };
      expect(() => validateCuisineParams(invalidParams)).toThrow();
    });

    test('rejects invalid cuisine slug format', () => {
      const invalidParams = { cuisine: ['2025-03-17', 'Olive & Basil'] };
      expect(() => validateCuisineParams(invalidParams)).toThrow();
    });
  });
});

describe('Available Cuisine Validation', () => {
  const validCuisineData = {
    cuisineSlug: 'olive-and-basil',
    dateSlug: '2025-03-17',
    cuisineName: 'Olive & Basil',
    eventDate: 'Monday, March 17'
  };

  describe('AvailableCuisineSchema', () => {
    test('validates correct cuisine data', () => {
      expect(() => AvailableCuisineSchema.parse(validCuisineData)).not.toThrow();
    });

    test('rejects invalid cuisine slug', () => {
      const invalidData = { ...validCuisineData, cuisineSlug: 'Invalid Slug!' };
      expect(() => AvailableCuisineSchema.parse(invalidData)).toThrow();
    });

    test('rejects invalid date slug', () => {
      const invalidData = { ...validCuisineData, dateSlug: '2025/03/17' };
      expect(() => AvailableCuisineSchema.parse(invalidData)).toThrow();
    });

    test('sanitizes cuisine name', () => {
      const dataWithHtml = { ...validCuisineData, cuisineName: 'Olive <b>& Basil</b>' };
      const result = AvailableCuisineSchema.parse(dataWithHtml);
      expect(result.cuisineName).toBe('Olive &lt;b&gt;&amp; Basil&lt;&#x2F;b&gt;');
    });
  });
});

describe('Search Query Validation', () => {
  describe('SearchQuerySchema', () => {
    test('validates empty query parameters', () => {
      expect(() => SearchQuerySchema.parse({})).not.toThrow();
    });

    test('validates search query', () => {
      const params = { q: 'olive', page: '1', limit: '10' };
      expect(() => SearchQuerySchema.parse(params)).not.toThrow();
    });

    test('rejects invalid page number', () => {
      const params = { page: '0' };
      expect(() => SearchQuerySchema.parse(params)).toThrow();
    });

    test('rejects invalid limit', () => {
      const params = { limit: '101' };
      expect(() => SearchQuerySchema.parse(params)).toThrow();
    });

    test('sanitizes search query', () => {
      const params = { q: '<script>alert("xss")</script>' };
      const result = SearchQuerySchema.parse(params);
      expect(result.q).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    test('applies default values', () => {
      const result = SearchQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});

describe('Error Formatting', () => {
  test('formats validation errors correctly', () => {
    expect(() => {
      MenuItemSchema.parse({ title: '', description: 'test' });
    }).toThrow();
  });

  test('formats multiple validation errors', () => {
    expect(() => {
      MenuItemSchema.parse({ title: '', description: '' });
    }).toThrow();
  });
});

describe('Edge Cases', () => {
  test('handles null and undefined inputs', () => {
    expect(() => validateMenuData(null)).toThrow();
    expect(() => validateMenuData(undefined)).toThrow();
    expect(() => validateAdminLogin(null)).toThrow();
    expect(() => validateAdminLogin(undefined)).toThrow();
  });

  test('handles empty objects', () => {
    expect(() => validateMenuData({})).toThrow();
    expect(() => validateAdminLogin({})).toThrow();
  });

  test('handles malformed data types', () => {
    expect(() => validateMenuData('string')).toThrow();
    expect(() => validateMenuData(123)).toThrow();
    expect(() => validateMenuData([])).toThrow();
  });

  test('handles extremely long strings', () => {
    const longString = 'a'.repeat(10000);
    const invalidItem = {
      title: longString,
      description: 'test',
      preferences: [],
      allergens: []
    };
    expect(() => MenuItemSchema.parse(invalidItem)).toThrow();
  });

  test('handles special characters in various fields', () => {
    const specialCharData = {
      caterer: 'Test Café & Bistró',
      event_date: 'Monday, March 17',
      event_date_iso: '2025-03-17',  
      menu_items: [{
        title: 'Entrée spéciale',
        description: 'A special dish with accénts',
        preferences: ['VEGAN'],
        allergens: ['Nuts & Seeds']
      }]
    };
    
    const result = validateMenuData(specialCharData);
    expect(result.caterer).toContain('Café');
  });
});