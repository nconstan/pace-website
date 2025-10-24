import { reactive } from 'vue'
import { validationRules } from '../Rules'
import { formatPhoneNumber, formatCreditCard, formatPostalCode, formatExpiryDate } from './formattingRules'

// Enhanced validation with real-time feedback
export const validateAndFormat = {
  phone: (value: string) => {
    const formatted = formatPhoneNumber(value)
    const validation = validationRules.phone(formatted)
    return { formatted, validation }
  },
  
  creditCard: (value: string) => {
    const formatted = formatCreditCard(value)
    const validation = validationRules.creditCard(formatted)
    return { formatted, validation }
  },
  
  postalCode: (value: string) => {
    const formatted = formatPostalCode(value)
    const validation = validationRules.postalCode(formatted)
    return { formatted, validation }
  },
  
  expiryDate: (value: string) => {
    const formatted = formatExpiryDate(value)
    const validation = validationRules.expiryDate(formatted)
    return { formatted, validation }
  }
}

// Validation state tracking
export const createValidationErrors = () => reactive({
  applicant: {
    primaryName: '',
    secondaryName: '',
    postalCode: '',
    street: '',
    city: '',
    province: ''
  },
  vehicle: {
    vin: '',
    odometer: '',
    purchasePrice: ''
  },
  debtInfo: {
    totalAmount: '',
    debtTerm: ''
  },
  contactInfo: {
    primary: {
      name: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      email: '',
      secondaryEmail: ''
    },
    secondary: {
      name: '',
      phoneNumber: '',
      secondaryPhoneNumber: '',
      email: '',
      secondaryEmail: ''
    }
  },
  paymentInfo: {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    billingAddress: '',
    lienholderName: '',
    loanNumber: '',
    accountHolderName: '',
    bankName: '',
    bankNumber: '',
    branchNumber: '',
    accountNumber: '',
    bankAddress: ''
  }
})

// Track which fields have been touched by the user
export const createTouchedFields = () => reactive({
  applicant: {
    primaryName: false,
    secondaryName: false,
    postalCode: false,
    street: false,
    city: false,
    province: false
  },
  vehicle: {
    vin: false,
    odometer: false,
    purchasePrice: false
  },
  debtInfo: {
    totalAmount: false,
    debtTerm: false
  },
  contactInfo: {
    primary: {
      name: false,
      phoneNumber: false,
      secondaryPhoneNumber: false,
      email: false,
      secondaryEmail: false
    },
    secondary: {
      name: false,
      phoneNumber: false,
      secondaryPhoneNumber: false,
      email: false,
      secondaryEmail: false
    }
  },
  paymentInfo: {
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    cardHolderName: false,
    billingAddress: false,
    lienholderName: false,
    loanNumber: false,
    accountHolderName: false,
    bankName: false,
    bankNumber: false,
    branchNumber: false,
    accountNumber: false,
    bankAddress: false
  }
})

// Validation utility functions
export const validateField = (value: any, rule: keyof typeof validationRules, options?: any) => {
  if (validationRules[rule]) {
    const result = validationRules[rule](value, options)
    return result
  }
  return { isValid: true, message: '' }
}

export const markFieldAsTouched = (touchedFields: any, path: string) => {
  const pathArray = path.split('.')
  let current: any = touchedFields
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i]
    if (key) {
      current = current[key]
    }
  }
  const lastKey = pathArray[pathArray.length - 1]
  if (lastKey) {
    current[lastKey] = true
  }
}

export const shouldShowError = (touchedFields: any, validationErrors: any, path: string) => {
  const pathArray = path.split('.')
  let touchedCurrent: any = touchedFields
  let errorCurrent: any = validationErrors
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i]
    if (key) {
      touchedCurrent = touchedCurrent[key]
      errorCurrent = errorCurrent[key]
    }
  }
  
  const fieldName = pathArray[pathArray.length - 1]
  return fieldName && touchedCurrent[fieldName] && errorCurrent[fieldName]
}

// Step validation functions
export const validateStep1 = (policyData: any, validationErrors: any) => {
  let isValid = true
  let errorCount = 0
  
  // Applicant validation
  const primaryNameValidation = validationRules.name(policyData.applicant.primaryName)
  validationErrors.applicant.primaryName = primaryNameValidation.message
  if (!primaryNameValidation.isValid) { isValid = false; errorCount++ }

  const postalCodeValidation = validationRules.postalCode(policyData.applicant.postalCode)
  validationErrors.applicant.postalCode = postalCodeValidation.message
  if (!postalCodeValidation.isValid) { isValid = false; errorCount++ }

  // Vehicle validation
  const vinValidation = validationRules.vin(policyData.vehicle.vin)
  validationErrors.vehicle.vin = vinValidation.message
  if (!vinValidation.isValid) { isValid = false; errorCount++ }

  const odometerValidation = validationRules.number(policyData.vehicle.odometer.toString(), 0, 999999)
  validationErrors.vehicle.odometer = odometerValidation.message
  if (!odometerValidation.isValid) { isValid = false; errorCount++ }

  const purchasePriceValidation = validationRules.number(policyData.vehicle.purchasePrice.toString(), 1000, 999999)
  validationErrors.vehicle.purchasePrice = purchasePriceValidation.message
  if (!purchasePriceValidation.isValid) { isValid = false; errorCount++ }

  // Debt information validation for financed/leased vehicles
  if (policyData.vehicle.purchaseMethod === 'financed' || policyData.vehicle.purchaseMethod === 'lease') {
    const totalAmountValidation = validationRules.number(policyData.debtInfo.totalAmount?.toString() || '', 0, 999999)
    validationErrors.debtInfo = validationErrors.debtInfo || {}
    validationErrors.debtInfo.totalAmount = totalAmountValidation.message
    if (!totalAmountValidation.isValid) { isValid = false; errorCount++ ; console.log('totalAmountValidation', totalAmountValidation)}

    const debtTermValidation = validationRules.number(policyData.debtInfo.debtTerm?.toString() || '', 1, 120)
    validationErrors.debtInfo.debtTerm = debtTermValidation.message
    if (!debtTermValidation.isValid) { isValid = false; errorCount++ ; console.log('debtTermValidation', debtTermValidation)}
  }

  if (!isValid) {
    console.log(`Step 1 validation failed with ${errorCount} errors`)
  }

  return isValid
}

export const validateStep2 = (policyData: any) => {
  let isValid = true
  let errorCount = 0
  
  // Check if product type is selected
  if (policyData.selectedProducts[0].productName === '') {
    isValid = false
    errorCount++
  }
  
  // Check if payment method is selected
  if (!policyData.paymentInfo.paymentMethod) {
    isValid = false
    errorCount++
  }

  if (!isValid) {
    console.log(`Step 2 validation failed with ${errorCount} errors`)
  }

  return isValid
}

export const validateStep3 = (policyData: any, validationErrors: any) => {
  let isValid = true
  let errorCount = 0
  
  // Address validation
  const streetValidation = validationRules.address(policyData.applicant.street)
  validationErrors.applicant.street = streetValidation.message
  if (!streetValidation.isValid) { isValid = false; errorCount++ }

  const cityValidation = validationRules.city(policyData.applicant.city)
  validationErrors.applicant.city = cityValidation.message
  if (!cityValidation.isValid) { isValid = false; errorCount++ }

  const provinceValidation = validationRules.province(policyData.applicant.province)
  validationErrors.applicant.province = provinceValidation.message
  if (!provinceValidation.isValid) { isValid = false; errorCount++ }

  // Contact validation
  const primaryPhoneValidation = validationRules.phone(policyData.contactInfo.primary.phoneNumber.value)
  validationErrors.contactInfo.primary.phoneNumber = primaryPhoneValidation.message
  if (!primaryPhoneValidation.isValid) { isValid = false; errorCount++ }

  const primaryEmailValidation = validationRules.email(policyData.contactInfo.primary.email.value)
  validationErrors.contactInfo.primary.email = primaryEmailValidation.message
  if (!primaryEmailValidation.isValid) { isValid = false; errorCount++ }

  // Secondary contact validation (if provided)
  if (policyData.applicant.secondaryName && !policyData.applicant.isOrganization) {
    if (policyData.contactInfo.secondary.phoneNumber.value) {
      const secondaryPhoneValidation = validationRules.phone(policyData.contactInfo.secondary.phoneNumber.value)
      validationErrors.contactInfo.secondary.phoneNumber = secondaryPhoneValidation.message
      if (!secondaryPhoneValidation.isValid) { isValid = false; errorCount++ }
    }
    
    if (policyData.contactInfo.secondary.email.value) {
      const secondaryEmailValidation = validationRules.email(policyData.contactInfo.secondary.email.value)
      validationErrors.contactInfo.secondary.email = secondaryEmailValidation.message
      if (!secondaryEmailValidation.isValid) { isValid = false; errorCount++ }
    }
  }

  // Payment method specific validation
  if (policyData.paymentInfo.paymentMethod === 'credit-card') {
    const cardNumberValidation = validationRules.creditCard(policyData.paymentInfo.cardNumber)
    validationErrors.paymentInfo.cardNumber = cardNumberValidation.message
    if (!cardNumberValidation.isValid) { isValid = false; errorCount++ }

    const expiryValidation = validationRules.expiryDate(policyData.paymentInfo.expiryDate)
    validationErrors.paymentInfo.expiryDate = expiryValidation.message
    if (!expiryValidation.isValid) { isValid = false; errorCount++ }

    const cvvValidation = validationRules.cvv(policyData.paymentInfo.cvv)
    validationErrors.paymentInfo.cvv = cvvValidation.message
    if (!cvvValidation.isValid) { isValid = false; errorCount++ }

    const cardHolderValidation = validationRules.name(policyData.paymentInfo.cardHolderName)
    validationErrors.paymentInfo.cardHolderName = cardHolderValidation.message
    if (!cardHolderValidation.isValid) { isValid = false; errorCount++ }
  }

  if (policyData.paymentInfo.paymentMethod === 'vehicle-financing') {
    const lienholderValidation = validationRules.required(policyData.paymentInfo.lienholderName)
    validationErrors.paymentInfo.lienholderName = lienholderValidation.message
    if (!lienholderValidation.isValid) { isValid = false; errorCount++ }

    const loanNumberValidation = validationRules.required(policyData.paymentInfo.loanNumber)
    validationErrors.paymentInfo.loanNumber = loanNumberValidation.message
    if (!loanNumberValidation.isValid) { isValid = false; errorCount++ }
  }

  if (policyData.paymentInfo.paymentMethod === 'policy-financing') {
    if (policyData.paymentInfo.financingMethod === 'credit-card') {
      const cardNumberValidation = validationRules.creditCard(policyData.paymentInfo.cardNumber)
      validationErrors.paymentInfo.cardNumber = cardNumberValidation.message
      if (!cardNumberValidation.isValid) { isValid = false; errorCount++ }

      const expiryValidation = validationRules.expiryDate(policyData.paymentInfo.expiryDate)
      validationErrors.paymentInfo.expiryDate = expiryValidation.message
      if (!expiryValidation.isValid) { isValid = false; errorCount++ }

      const cvvValidation = validationRules.cvv(policyData.paymentInfo.cvv)
      validationErrors.paymentInfo.cvv = cvvValidation.message
      if (!cvvValidation.isValid) { isValid = false; errorCount++ }
    }

    if (policyData.paymentInfo.financingMethod === 'direct-deposit') {
      const accountHolderValidation = validationRules.name(policyData.paymentInfo.accountHolderName)
      validationErrors.paymentInfo.accountHolderName = accountHolderValidation.message
      if (!accountHolderValidation.isValid) { isValid = false; errorCount++ }

      const bankNameValidation = validationRules.required(policyData.paymentInfo.bankName)
      validationErrors.paymentInfo.bankName = bankNameValidation.message
      if (!bankNameValidation.isValid) { isValid = false; errorCount++ }

      const bankNumberValidation = validationRules.bankRouting(policyData.paymentInfo.bankNumber)
      validationErrors.paymentInfo.bankNumber = bankNumberValidation.message
      if (!bankNumberValidation.isValid) { isValid = false; errorCount++ }

      const branchNumberValidation = validationRules.bankRouting(policyData.paymentInfo.branchNumber)
      validationErrors.paymentInfo.branchNumber = branchNumberValidation.message
      if (!branchNumberValidation.isValid) { isValid = false; errorCount++ }

      const accountNumberValidation = validationRules.bankAccount(policyData.paymentInfo.accountNumber)
      validationErrors.paymentInfo.accountNumber = accountNumberValidation.message
      if (!accountNumberValidation.isValid) { isValid = false; errorCount++ }
    }
  }

  if (!isValid) {
    console.log(`Step 3 validation failed with ${errorCount} errors`)
  }

  return isValid
}

export const validateStep4 = () => {
  // Step 4 is just review, so it's always valid
  return true
}
