import { ref, computed } from 'vue'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function useValidation() {
  const errors = ref<Record<string, string[]>>({})
  const touched = ref<Record<string, boolean>>({})

  const validateField = (value: any, rules: ValidationRule, fieldName: string): string[] => {
    const fieldErrors: string[] = []

    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${fieldName} is required`)
    }

    if (value && rules.minLength && value.toString().length < rules.minLength) {
      fieldErrors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }

    if (value && rules.maxLength && value.toString().length > rules.maxLength) {
      fieldErrors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }

    if (value && rules.pattern && !rules.pattern.test(value.toString())) {
      fieldErrors.push(`${fieldName} format is invalid`)
    }

    if (value && rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value.toString())) {
        fieldErrors.push(`${fieldName} must be a valid email address`)
      }
    }

    if (value && rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        fieldErrors.push(customError)
      }
    }

    return fieldErrors
  }

  const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult => {
    const allErrors: Record<string, string[]> = {}
    let isValid = true

    Object.keys(rules).forEach(fieldName => {
      const fieldErrors = validateField(data[fieldName], rules[fieldName], fieldName)
      if (fieldErrors.length > 0) {
        allErrors[fieldName] = fieldErrors
        isValid = false
      }
    })

    errors.value = allErrors
    return { isValid, errors: Object.values(allErrors).flat() }
  }

  const setFieldError = (fieldName: string, error: string) => {
    if (!errors.value[fieldName]) {
      errors.value[fieldName] = []
    }
    errors.value[fieldName].push(error)
  }

  const clearFieldError = (fieldName: string) => {
    delete errors.value[fieldName]
  }

  const clearAllErrors = () => {
    errors.value = {}
  }

  const markFieldAsTouched = (fieldName: string) => {
    touched.value[fieldName] = true
  }

  const isFieldTouched = (fieldName: string): boolean => {
    return touched.value[fieldName] || false
  }

  const hasFieldError = (fieldName: string): boolean => {
    return !!(errors.value[fieldName] && errors.value[fieldName].length > 0)
  }

  const getFieldError = (fieldName: string): string => {
    return errors.value[fieldName]?.[0] || ''
  }

  const isFormValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  return {
    errors,
    touched,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    markFieldAsTouched,
    isFieldTouched,
    hasFieldError,
    getFieldError,
    isFormValid
  }
} 