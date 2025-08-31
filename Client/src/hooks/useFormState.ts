import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FieldConfig {
  [key: string]: ValidationRule;
}

export interface FormStateOptions<T> {
  initialData: T;
  validation?: FieldConfig;
  onSubmit?: (data: T) => Promise<void> | void;
}

export interface FormState<T> {
  formData: T;
  loading: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  updateFormData: (field: keyof T, value: any) => void;
  updateMultipleFields: (updates: Partial<T>) => void;
  setLoading: (loading: boolean) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  markFieldTouched: (field: keyof T) => void;
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  validation = {},
  onSubmit
}: FormStateOptions<T>): FormState<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateFormData = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const markFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const fieldName = field as string;
    const value = formData[field];
    const rules = validation[fieldName];

    if (!rules) return true;

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      setError(fieldName, `${fieldName} is required`);
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return true;
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        setError(fieldName, `${fieldName} must be at least ${rules.minLength} characters`);
        return false;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        setError(fieldName, `${fieldName} must be no more than ${rules.maxLength} characters`);
        return false;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        setError(fieldName, `${fieldName} format is invalid`);
        return false;
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        setError(fieldName, customError);
        return false;
      }
    }

    return true;
  }, [formData, validation, setError]);

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    let isValid = true;

    Object.keys(validation).forEach(field => {
      if (!validateField(field as keyof T)) {
        isValid = false;
      }
    });

    return isValid;
  }, [validation, validateField, clearAllErrors]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setLoading(false);
  }, [initialData]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      setLoading(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
        setError('submit', 'An error occurred while submitting the form');
      } finally {
        setLoading(false);
      }
    }
  }, [formData, validateForm, onSubmit]);

  const isValid = Object.keys(errors).length === 0;

  return {
    formData,
    loading,
    errors,
    touched,
    isValid,
    updateFormData,
    updateMultipleFields,
    setLoading,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
    markFieldTouched
  };
}

export default useFormState;
