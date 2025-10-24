export const autoValidate = (value: any, fieldName: string) => {
  // Convert snake_case to camelCase for easier matching
  const convertToCamelCase = (str: string) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  let validationType = convertToCamelCase(fieldName)
  
  // Map specific field patterns to validation types
  if(fieldName.includes('name')) validationType = 'name'
  if(fieldName.includes('nickname') || fieldName == 'name') validationType = 'nickname'
  if(fieldName.includes('email')) validationType = 'email'
  if(fieldName.includes('phone')) validationType = 'phone'
  if(fieldName.includes('address')) validationType = 'address'
  if(fieldName.includes('city')) validationType = 'city'
  if(fieldName.includes('province')) validationType = 'province'
  
  const validationFunction = validationRules[validationType as keyof typeof validationRules]
  if (typeof validationFunction === 'function') {
    return validationFunction(value)
  }
  
  // Default to required validation if no specific rule found
  return validationRules.required(value)
}

// Validation rules for form fields
export const validationRules = {
  // Name validation - letters, spaces, hyphens, apostrophes only
  name: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Name is required' }
    if (value.trim().length < 2) return { isValid: false, message: 'Name must be at least 2 characters' }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' }
    return { isValid: true, message: '' }
  },

  nickname: (value: string) => {
    if (!value || value.trim().length < 3) return { isValid: false, message: 'Nickname must be at least 3 characters' }
    return { isValid: true, message: '' }
  },

  // Email validation with proper format
  email: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Email is required' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) return { isValid: false, message: 'Please enter a valid email address' }
    return { isValid: true, message: '' }
  },

  // Phone number validation - accepts various formats
  phone: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Phone number is required' }
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length < 10) return { isValid: false, message: 'Phone number must have at least 10 digits' }
    if (digitsOnly.length > 15) return { isValid: false, message: 'Phone number cannot exceed 15 digits' }
    return { isValid: true, message: '' }
  },

  // VIN validation - exactly 17 characters, specific pattern
  vin: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'VIN is required' }
    if (value.length !== 17) return { isValid: false, message: 'VIN must be exactly 17 characters' }
    const validVINPattern = /^[A-HJ-NPR-Z0-9]{17}$/
    if (!validVINPattern.test(value.toUpperCase())) return { isValid: false, message: 'VIN contains invalid characters. VINs can only contain letters (except I, O, Q) and numbers.' }
    return { isValid: true, message: '' }
  },

  // Postal code validation - Canadian format
  postalCode: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Postal code is required' }
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
    if (!postalRegex.test(value.trim())) return { isValid: false, message: 'Please enter a valid Canadian postal code (e.g., A1A 1A1)' }
    return { isValid: true, message: '' }
  },

  // Credit card number validation
  creditCard: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Card number is required' }
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length < 13) return { isValid: false, message: 'Card number must have at least 13 digits' }
    if (digitsOnly.length > 19) return { isValid: false, message: 'Card number cannot exceed 19 digits' }
    // Luhn algorithm check
    if (!luhnCheck(digitsOnly)) return { isValid: false, message: 'Invalid card number' }
    return { isValid: true, message: '' }
  },

  // CVV validation
  cvv: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'CVV is required' }
    if (!/^\d{3,4}$/.test(value.trim())) return { isValid: false, message: 'CVV must be 3 or 4 digits' }
    return { isValid: true, message: '' }
  },

  // Expiry date validation
  expiryDate: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Expiry date is required' }
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/
    if (!expiryRegex.test(value.trim())) return { isValid: false, message: 'Please enter expiry date in MM/YY format' }
    
    const [month, year] = value.split('/')
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return { isValid: false, message: 'Card has expired' }
    }
    return { isValid: true, message: '' }
  },

  // Required field validation
  required: (value: string) => {
    if (!value || typeof value === 'string' && value.trim().length === 0) return { isValid: false, message: 'This field is required' }
    return { isValid: true, message: '' }
  },

  // Number validation
  number: (value: string, min?: number, max?: number) => {
    if (!value || value.toString().trim().length === 0) return { isValid: false, message: 'This field is required' }
    const num = parseFloat(value)
    if (isNaN(num)) return { isValid: false, message: 'Please enter a valid number' }
    if (min !== undefined && num < min) return { isValid: false, message: `Value must be at least ${min}` }
    if (max !== undefined && num > max) return { isValid: false, message: `Value must be no more than ${max}` }
    return { isValid: true, message: '' }
  },

  // Address validation
  address: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Address is required' }
    if (value.trim().length < 5) return { isValid: false, message: 'Address must be at least 5 characters' }
    return { isValid: true, message: '' }
  },

  // City validation
  city: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'City is required' }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) return { isValid: false, message: 'City can only contain letters, spaces, hyphens, apostrophes, and periods' }
    return { isValid: true, message: '' }
  },

  // Province validation
province: (value: string) => {
  if (!value || value.trim().length === 0) return { isValid: false, message: 'Province is required' }
  // Accept province codes (2-letter codes like ON, BC, etc.)
  const validProvinceCodes = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']
  if (!validProvinceCodes.includes(value.trim().toUpperCase())) return { isValid: false, message: 'Please select a valid province' }
  return { isValid: true, message: '' }
},

  // Bank account number validation
  bankAccount: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Account number is required' }
    if (!/^\d{4,17}$/.test(value.replace(/\s/g, ''))) return { isValid: false, message: 'Account number must be 4-17 digits' }
    return { isValid: true, message: '' }
  },

  // Bank routing number validation
  bankRouting: (value: string) => {
    if (!value || value.trim().length === 0) return { isValid: false, message: 'Routing number is required' }
    if (!/^\d{8,9}$/.test(value.replace(/\s/g, ''))) return { isValid: false, message: 'Routing number must be 8-9 digits' }
    return { isValid: true, message: '' }
  }
}

// Luhn algorithm for credit card validation
export const luhnCheck = (num: string): boolean => {
  let arr = (num + '')
    .split('')
    .reverse()
    .map(x => parseInt(x))
  let lastDigit = arr.splice(0, 1)[0]
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0)
  sum += lastDigit
  return sum % 10 === 0
}
