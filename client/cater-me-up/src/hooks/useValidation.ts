import { useState, useCallback } from 'react';
import { z } from 'zod';
import { formatValidationError } from '../lib/validation';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
  clearErrors: () => void;
  clearError: (field: string) => void;
}

export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: unknown): ValidationResult & { data?: T } => {
    try {
      const validatedData = schema.parse(data);
      setErrors({});
      return {
        isValid: true,
        errors: {},
        data: validatedData,
        hasError: () => false,
        getError: () => undefined,
        clearErrors: () => setErrors({}),
        clearError: (field: string) => setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        })
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
        });
        
        setErrors(fieldErrors);
        
        return {
          isValid: false,
          errors: fieldErrors,
          hasError: (field: string) => field in fieldErrors,
          getError: (field: string) => fieldErrors[field],
          clearErrors: () => setErrors({}),
          clearError: (field: string) => setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          })
        };
      }
      
      // Handle non-Zod errors
      const genericError = { general: 'Validation failed' };
      setErrors(genericError);
      
      return {
        isValid: false,
        errors: genericError,
        hasError: (field: string) => field === 'general',
        getError: (field: string) => field === 'general' ? 'Validation failed' : undefined,
        clearErrors: () => setErrors({}),
        clearError: (field: string) => setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        })
      };
    }
  }, [schema]);

  const validateField = useCallback((fieldName: string, value: unknown) => {
    try {
      // Extract the field schema from the main schema
      const fieldSchema = (schema as any).shape?.[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error for this field if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
        return false;
      }
    }
    return false;
  }, [schema]);

  return {
    validate,
    validateField,
    errors,
    hasError: useCallback((field: string) => field in errors, [errors]),
    getError: useCallback((field: string) => errors[field], [errors]),
    clearErrors: useCallback(() => setErrors({}), []),
    clearError: useCallback((field: string) => setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    }), [])
  };
}

// Real-time validation hook for form fields
export function useFieldValidation<T>(schema: z.ZodSchema<T>, debounceMs: number = 300) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  const validateField = useCallback((fieldName: string, value: unknown) => {
    setIsValidating(prev => ({ ...prev, [fieldName]: true }));
    
    const timeoutId = setTimeout(() => {
      try {
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors[0]?.message || 'Invalid value';
          setFieldErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
        }
      } finally {
        setIsValidating(prev => ({ ...prev, [fieldName]: false }));
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [schema, debounceMs]);

  return {
    validateField,
    fieldErrors,
    isValidating,
    hasFieldError: useCallback((field: string) => field in fieldErrors, [fieldErrors]),
    getFieldError: useCallback((field: string) => fieldErrors[field], [fieldErrors]),
    clearFieldError: useCallback((field: string) => setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    }), [])
  };
}