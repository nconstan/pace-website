export const autoFormat = (event: Event, formatMethod: string) => {
    const input = event.target as HTMLInputElement
    const value = input.value
    let formattedValue: string | undefined
    switch (formatMethod) {
        case 'phone':
            formattedValue = formatPhoneNumber(value)
            break
        case 'postalCode':
            formattedValue = formatPostalCode(value)
            break
        case 'expiryDate':
            formattedValue = formatExpiryDate(value)
            break
        case 'creditCard':
            formattedValue = formatCreditCard(value)
            break
    }
    input.value = formattedValue!
}

export const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format based on length
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }
  
  export const formatCreditCard = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as XXXX XXXX XXXX XXXX
    const groups = []
    for (let i = 0; i < digits.length && i < 16; i += 4) {
      groups.push(digits.slice(i, i + 4))
    }
    
    return groups.join(' ')
  }
  
  export const formatPostalCode = (value: string) => {
    // Remove all non-alphanumeric
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    if (cleaned.length <= 3) {
      return cleaned
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }
  
  export const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    if (digits.length <= 2) {
      return digits
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    }
  }