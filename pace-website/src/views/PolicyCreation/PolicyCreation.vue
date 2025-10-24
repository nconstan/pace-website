<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Check, Car, CreditCard, FileText, Save, Search } from 'lucide-vue-next'
import policyService from '../../services/policy.service'
//import adminService from '../../services/admin.service'
import { useManagementStore } from '../../stores/management'
import PCSection1 from './PCSection1.vue'
import PCSection2 from './PCSection2.vue'
import PCSection3 from './PCSection3.vue'
import PCSection4 from './PCSection4.vue'
import FindPolicyModal from './FindPolicyModal.vue'
import { 
  createValidationErrors, 
  createTouchedFields, 
  markFieldAsTouched, 
  shouldShowError,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
} from '../../Mixins/Validation/PolicyValidation'
import { validationRules } from '../../Mixins/Rules'

const route = useRoute()
const currentStep = ref(1)
const totalSteps = 4

// Validation state tracking
const validationErrors = createValidationErrors()
const touchedFields = createTouchedFields()

// Refund calculation state
const refundAmount = ref(0)
const isTransferMode = ref(false)
const originalPolicyId = ref('')

// Find Policy Modal state
const showFindPolicyModal = ref(false)

// Customer lookup state
const customerNumber = ref('')
const showCustomerLookup = ref(true)
//const customerLookupLoading = ref(false)
const customerLookupError = ref('')
const existingCustomer = ref<any>(null)

// Mark field as touched when user interacts with it
const markFieldAsTouchedLocal = (path: string) => {
  markFieldAsTouched(touchedFields, path)
  const vinValidation = validationRules.vin(policyData.vehicle?.vin || '')
  if(vinValidation.isValid){
    //policyService.saveQuickQuote({ policy: policyData, currentStep: currentStep.value })
  }
}

// Check if field should show error (only if touched and has error)
const shouldShowErrorLocal = (path: string) => {
  return shouldShowError(touchedFields, validationErrors, path)
}

export interface productPriceDetail {
  productName: string,
  priceAtMonth: {month: number, price: number}[],
}

const pricingData = reactive({
  products: [] as productPriceDetail[],
})


const policyData = reactive({  
  applicant:{
    isOrganization: false,
    primaryName:'',
    secondaryName:'',
    postalCode:'',
    street:'',
    street2:'',
    city:'',
    province:'',
    customerNumber:null,
  },
  contactInfo:{
    primary:{
      name:{value:'', optional:false, rules:['name']},
      phoneNumber:{value:'', optional:false, rules:['phone']},
      secondaryPhoneNumber:{value:'', optional:true, rules:['phone']},
      email:{value:'', optional:false, rules:['email']},
      secondaryEmail:{value:'', optional:true, rules:['email']},
    },
    secondary:{
      name:{value:'', optional:true, rules:['name']},
      phoneNumber:{value:'', optional:true, rules:['phone']},
      secondaryPhoneNumber:{value:'', optional:true, rules:['phone']},
      email:{value:'', optional:true, rules:['email']},
      secondaryEmail:{value:'', optional:true, rules:['email']},
    },
  },
  vehicle:{
    vin:'',
    odometer:0,
    purchaseMethod:'cash',
    purchasePrice:0,
    make:'',
    model:'',
    series:'',
    modelYear:0,
  },
  debtInfo:{
    totalAmount:0,
    interestRate:0,
    debtTerm:0,
    monthlyPayment:0,
    residualValue:0,
    rolledInNegativeEquity:0,
    downPayment:0,
  },
  selectedProducts:[
    {productName:'', productTerm:'60', price: 0}, // Primary product
    {productName:'', productTerm:'', price: 0}  // Secondary product
  ],
  paymentInfo:{
    paymentMethod:'vehicle-financing',
    cardNumber:'',
    expiryDate:'',
    cvv:'',
    cardHolderName:'',
    billingAddress:'',
    financingMethod:'credit-card',
    lienholderName:'',
    loanNumber:'',
    accountHolderName:'',
    bankName:'',
    bankNumber:'',
    branchNumber:'',
    accountNumber:'',
    bankAddress:'',
    PFATerm:12,
    dealerReference:'',
    dealerFinanceReference:'',
    monthlyPaymentDate:15,
  },
  dealership: null as any,
  transfered_from: null as any,
})


const stepTitles = [
  'Vehicle Information',
  'Policy Details',
  'Payment Information',
  'Review & Confirm'
]

const stepIcons = [Car, FileText, CreditCard, Check]

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return validateStep1(policyData, validationErrors)
    case 2:
      return validateStep2(policyData)
    case 3:
      return validateStep3(policyData, validationErrors)
    case 4:
      return validateStep4()
    default:
      return false
  }
})

onMounted(async () => {
  const store = useManagementStore()
  try {
    await store.initializeDealerships()
    if (store.dealerships.length > 0) {
      store.selectedDealership = store.dealerships[0]
    }
    
    // Check if this is a policy transfer (has policyId parameter)
    const policyId = route.query.policyId as string
    if (policyId) {
      isTransferMode.value = true
      originalPolicyId.value = policyId
      
      // Calculate refund amount for the original policy
      try {
        const refund = await policyService.calculateRefund(policyId)
        console.log(refund)
        refundAmount.value = refund.refundAmount
        console.log('Refund amount calculated:', refundAmount.value)
      } catch (error) {
        console.error('Error calculating refund:', error)
        alert('Error calculating refund amount. Please try again.')
      }
    }
  } catch (error) {
    console.error('Error loading dealerships:', error)
  }
})

const calculatePricing = async () => {
  try{
    let products = policyData.vehicle.purchaseMethod === 'cash' ? ['RCC'] : ['RCE', 'RCP','RCD', 'GTU']
    if(policyData.debtInfo.rolledInNegativeEquity > 0 && policyData.vehicle.purchaseMethod !== 'cash') products.push('RNE')
    let pricing = await policyService.getAllPricing(policyData, products)
    console.log("pricing", pricing)
    pricingData.products = pricing
    needsToCalculatePricing.value = false
    return true
  } catch (error) {
    alert('Error calculating pricing: ' + error)
    return false
  }
}

// function getPrice(term: string, gapTopUp: boolean) {
//   let basePrice:any = calculatePrice(parseInt(policyData.loanTerm), parseInt(policyData.loanPaymentMonthly), parseInt(term))
//   if(gapTopUp) basePrice = basePrice/2
//   return basePrice
// }


const needsToCalculatePricing = ref(false)

watch(policyData.vehicle, () => {
  console.log('vehicle changed')
  needsToCalculatePricing.value = true
}, { deep: true })

watch(() => policyData.applicant.postalCode, () => {
  console.log('postal code changed')
  needsToCalculatePricing.value = true
})

watch(() => policyData.debtInfo, () => {
  console.log('debt info changed')
  needsToCalculatePricing.value = true
}, { deep: true })

const nextStep = () => {
  // Validate current step before proceeding
  let stepValid = false
  switch (currentStep.value) {
    case 1:
      stepValid = validateStep1(policyData, validationErrors)
      if(needsToCalculatePricing.value) {
        console.log("needs to calculate pricing")
        if(!calculatePricing()) {
          return
        }
      }
      break
    case 2:
      stepValid = validateStep2(policyData)
      break
    case 3:
      stepValid = validateStep3(policyData, validationErrors)
      // Set dealership from store if not already set
      if (!policyData.dealership || Object.keys(policyData.dealership).length === 0) {
        policyData.dealership = useManagementStore().selectedDealership || {}
      }
      break
    case 4:
      stepValid = validateStep4()
      break
  }

  if (currentStep.value < totalSteps && stepValid) {
    currentStep.value++
    window.scrollTo({
      top: 101,
      behavior: 'auto'
    })
  } else if (!stepValid) {
    // Show validation errors
    alert('Please fix the validation errors before proceeding.')
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({
      top: 101,
      behavior: 'auto'
    })
  }
}

const getVIN = async () => {
  // Basic VIN validation
  if (!policyData.vehicle.vin) {
    alert('Please enter a VIN')
    return
  }

  // Check VIN length
  if (policyData.vehicle.vin.length !== 17) {
    alert('VIN must be exactly 17 characters')
    return
  }

  // Check for valid characters
  const validVINPattern = /^[A-HJ-NPR-Z0-9]{17}$/
  if (!validVINPattern.test(policyData.vehicle.vin)) {
    alert('VIN contains invalid characters. VINs can only contain letters (except I, O, Q) and numbers.')
    return
  }
  let vinData = await policyService.getVinData(policyData.vehicle.vin)

  console.log("vinData", vinData)

  policyData.vehicle.make = vinData.make
  policyData.vehicle.model = vinData.model
  policyData.vehicle.series = vinData.series
  policyData.vehicle.modelYear = vinData.modelYear
}

const saveQuote = () => {
  console.log("saving quote", policyData)
}

const submitPolicy = async () => {
  // Handle policy submission
  if(!policyData.applicant.isOrganization) {
    policyData.contactInfo.primary.name.value = policyData.applicant.primaryName
    if(policyData.applicant.secondaryName) {
      policyData.contactInfo.secondary.name.value = policyData.applicant.secondaryName
    }
  } else {
    // For organizations, primary contact is the secondary name field
    policyData.contactInfo.primary.name.value = policyData.applicant.secondaryName
  }
  
  // Ensure dealership is a string ID
  if(policyData.dealership && typeof policyData.dealership === 'object') {
    policyData.dealership = policyData.dealership.id
  }

  if(isTransferMode.value) {
    policyData.transfered_from = originalPolicyId.value
  }
  
  let policy = await policyService.createPolicy(policyData)
  if(policy) {
    alert('Policy created successfully!')
  } else {
    alert('Failed to create policy')
  }
}

const openFindPolicyModal = () => {
  showFindPolicyModal.value = true
}

const closeFindPolicyModal = () => {
  showFindPolicyModal.value = false
}

const handlePolicySelection = (policyId: string, refundAmountValue: number) => {
  isTransferMode.value = true
  originalPolicyId.value = policyId
  refundAmount.value = refundAmountValue
  showFindPolicyModal.value = false
}

const handleCustomerSelection = (customer: any) => {
  existingCustomer.value = customer
      
      existingCustomer.value = customer
      showCustomerLookup.value = false

      console.log("customer", customer)
      
      // Populate the form with existing customer data
      policyData.applicant.primaryName = customer.first_name_1 || ''
      policyData.applicant.secondaryName = customer.first_name_2 || ''
      policyData.applicant.postalCode = customer.postal_code || ''
      policyData.applicant.street = customer.address_1 || ''
      policyData.applicant.street2 = customer.address_2 || ''
      policyData.applicant.city = customer.city || ''
      policyData.applicant.province = customer.province || ''
      policyData.applicant.isOrganization = customer.is_company || false
      policyData.applicant.customerNumber = customer.customer_number || null
      
      // Populate contact info
      policyData.contactInfo.primary.name.value = customer.first_name_1 || ''
      policyData.contactInfo.primary.phoneNumber.value = customer.phone_number_1 || ''
      policyData.contactInfo.primary.email.value = customer.email_1 || ''
      policyData.contactInfo.secondary.name.value = customer.first_name_2 || ''
      policyData.contactInfo.secondary.phoneNumber.value = customer.phone_number_2 || ''
      policyData.contactInfo.secondary.email.value = customer.email_2 || ''
      
}

// const lookupCustomer = async () => {
//   if (!customerNumber.value.trim()) {
//     customerLookupError.value = 'Please enter a customer number'
//     return
//   }

//   try {
//     customerLookupLoading.value = true
//     customerLookupError.value = ''
    
//     // Look up customer by customer number
//     const customer = await adminService.getApplicantByCustomerNumber(customerNumber.value.trim())
    
//     if (customer) {
//       existingCustomer.value = customer
//       showCustomerLookup.value = false
      
//       // Populate the form with existing customer data
//       policyData.applicant.primaryName = customer.first_name_1 || ''
//       policyData.applicant.secondaryName = customer.first_name_2 || ''
//       policyData.applicant.postalCode = customer.postal_code || ''
//       policyData.applicant.street = customer.address_1 || ''
//       policyData.applicant.street2 = customer.address_2 || ''
//       policyData.applicant.city = customer.city || ''
//       policyData.applicant.province = customer.province || ''
//       policyData.applicant.isOrganization = customer.is_company || false
//       policyData.applicant.customerNumber = customer.customer_number || null
      
//       // Populate contact info
//       policyData.contactInfo.primary.name.value = customer.first_name_1 || ''
//       policyData.contactInfo.primary.phoneNumber.value = customer.phone_number_1 || ''
//       policyData.contactInfo.primary.email.value = customer.email_1 || ''
//       policyData.contactInfo.secondary.name.value = customer.first_name_2 || ''
//       policyData.contactInfo.secondary.phoneNumber.value = customer.phone_number_2 || ''
//       policyData.contactInfo.secondary.email.value = customer.email_2 || ''
      
//     } else {
//       customerLookupError.value = 'No customer found with that customer number'
//     }
//   } catch (error) {
//     console.error('Error looking up customer:', error)
//     customerLookupError.value = 'Error looking up customer. Please try again.'
//   } finally {
//     customerLookupLoading.value = false
//   }
// }

const clearCustomerLookup = () => {
  customerNumber.value = ''
  existingCustomer.value = null
  showCustomerLookup.value = true
  customerLookupError.value = ''
  
  // Clear the form data
  policyData.applicant.primaryName = ''
  policyData.applicant.secondaryName = ''
  policyData.applicant.postalCode = ''
  policyData.applicant.street = ''
  policyData.applicant.street2 = ''
  policyData.applicant.city = ''
  policyData.applicant.province = ''
  policyData.applicant.isOrganization = false
  
  policyData.contactInfo.primary.name.value = ''
  policyData.contactInfo.primary.phoneNumber.value = ''
  policyData.contactInfo.primary.email.value = ''
  policyData.contactInfo.secondary.name.value = ''
  policyData.contactInfo.secondary.phoneNumber.value = ''
  policyData.contactInfo.secondary.email.value = ''
}
</script>

<template>
  <div class="policy-creation">
    <div class="policy-header">
      <div class="dealership-selector" v-if="currentStep === 1">
        <select v-model="useManagementStore().selectedDealership" class="dealership-dropdown">      
          <option v-for="dealership in useManagementStore().dealerships" :key="dealership.id" :value="dealership">
            {{ dealership.name }}
          </option>
        </select>
      </div>
      <h1 class="policy-title">{{ isTransferMode ? 'Transfer Policy' : 'Create New Policy' }}</h1>
      
      <div class="progress-indicator">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }"></div>
        </div>
        <span class="progress-text">Step {{ currentStep }} of {{ totalSteps }}</span>
      </div>
    </div>

    <!-- Step Navigation -->
    <div class="step-navigation">
      <div
        v-for="(title, index) in stepTitles"
        :key="index"
        class="step-indicator"
        :class="{ 
          'step-active': currentStep === index + 1,
          'step-completed': currentStep > index + 1
        }"
      >
        <div class="step-number">
          <component :is="stepIcons[index]" class="step-icon" />
        </div>
        <span class="step-title">{{ title }}</span>
      </div>
    </div>

    <!-- Customer Lookup Section -->
    <div v-if="!existingCustomer" class="customer-lookup-section">
      <div class="customer-lookup-card">
        <h3>Already have a policy with us?</h3>
        <p>Find your existing account to automatically fill in your information and transfer policies.</p>
        <button @click="openFindPolicyModal" class="find-account-button">
          <Search class="button-icon" />
          Find Existing Account
        </button>
      </div>
    </div>

    <!-- Customer Found Section -->
    <div v-if="existingCustomer" class="customer-found-section">
      <div class="customer-found-card">
        <h3>Customer Information Loaded</h3>
        <p><strong>Customer #{{ existingCustomer.customer_number }}</strong> - {{ existingCustomer.first_name_1 }}{{ existingCustomer.first_name_2 ? ' ' + existingCustomer.first_name_2 : '' }}</p>
        <button @click="clearCustomerLookup" class="clear-customer-button">
          Use Different Customer
        </button>
      </div>
    </div>

    <!-- Refund Information for Transfer Mode -->
    <div v-if="isTransferMode && refundAmount > 0" class="refund-info">
        <div class="refund-card">
          <h3>Refund from Original Policy</h3>
          <p class="refund-amount">${{ refundAmount.toFixed(2) }}</p>
          <p class="refund-note">This amount will be applied to your new policy</p>
        </div>
      </div>

    <!-- Step Content -->
    <div>
      <!-- Step 1: Vehicle Information -->
      <PCSection1 
        v-if="currentStep === 1"
        :policyData="policyData"
        :getVIN="getVIN"
        :validationErrors="validationErrors"
        :touchedFields="touchedFields"
        :markFieldAsTouched="markFieldAsTouchedLocal"
        :shouldShowError="shouldShowErrorLocal"
        :calculatePricing="calculatePricing"
      />
      <PCSection2
        v-if="currentStep === 2"
        :policyData="policyData"
        :validationErrors="validationErrors"
        :touchedFields="touchedFields"
        :markFieldAsTouched="markFieldAsTouchedLocal"
        :shouldShowError="shouldShowErrorLocal"
        :pricingData="pricingData"
      />  
      <PCSection3
        v-if="currentStep === 3"
        :policyData="policyData"
        :validationErrors="validationErrors"
        :touchedFields="touchedFields"
        :markFieldAsTouched="markFieldAsTouchedLocal"
        :shouldShowError="shouldShowErrorLocal"
      />
      <PCSection4
        v-if="currentStep === 4"
        :policyData="policyData"
        :validationErrors="validationErrors"
        :touchedFields="touchedFields"
        :markFieldAsTouched="markFieldAsTouchedLocal"
        :shouldShowError="shouldShowErrorLocal"
      />
    </div>

    <!-- Find Policy Modal -->
    <FindPolicyModal 
      :isOpen="showFindPolicyModal"
      @close="closeFindPolicyModal"
      @selectPolicy="handlePolicySelection"
      @useCustomer="handleCustomerSelection"
    />

    <!-- Step Navigation Buttons -->
    <div class="step-actions">
      <button
        v-if="currentStep > 1"
        @click="prevStep"
        class="btn btn-secondary"
      >
        <ChevronLeft class="btn-icon" />
        Previous
      </button>
      
      <div class="spacer"></div>

      <button
        v-if="currentStep === 2"
        @click="saveQuote"
        class="btn btn-save"
      >
        Save Quote
        <Save class="btn-icon" />
      </button>
      
      <button
        v-if="currentStep < totalSteps"
        @click="nextStep"
        class="btn btn-primary"
        :disabled="!isStepValid"
      >
        Next
        <ChevronRight class="btn-icon" />
      </button>
      
      <button
        v-if="currentStep === totalSteps"
        @click="submitPolicy"
        class="btn btn-success"
      >
        <Check class="btn-icon" />
        Submit Application
      </button>
    </div>
  </div>
</template>

<style scoped>
.policy-creation {
  max-width: 900px;
  margin: 0 auto;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.policy-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ffa242;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.refund-info {
  margin: 1rem 0;
}

.refund-card {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.refund-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.refund-amount {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.refund-note {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.customer-lookup-section {
  margin: 1rem 0;
}

.customer-lookup-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.customer-lookup-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.customer-lookup-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.customer-lookup-form {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.customer-lookup-input {
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  min-width: 200px;
}

.customer-lookup-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.customer-lookup-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
}

.customer-lookup-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.customer-lookup-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.customer-lookup-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.customer-lookup-error {
  color: #fecaca;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.customer-found-section {
  margin: 1rem 0;
}

.customer-found-card {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.customer-found-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.customer-found-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.clear-customer-button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.clear-customer-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.find-policy-section {
  margin: 1rem 0;
}

.find-policy-card {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.find-policy-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.find-policy-card p {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.find-policy-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.find-policy-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.step-number {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.step-active .step-number {
  background: #ffa242;
  color: #2A525A;
}

.step-completed .step-number {
  background: #10b981;
  color: white;
}

.step-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}

.step-active .step-title {
  color: #2A525A;
  font-weight: 600;
}

.step-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.step-panel {
  min-height: 100px;
}

.step-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group.products-group {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2A525A;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: #2A525A;
}

.product-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.05);
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.product-price {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* New styles for page 2 product cards */
.product-cards-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.product-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
  transition: all 0.2s;
}

.product-card:hover {
  border-color: #2A525A;
}

.product-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.05);
}

.product-header {
  margin-bottom: 1.5rem;
}

.product-radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.product-radio {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.product-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.term-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.term-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.term-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.term-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.term-option:hover {
  border-color: #2A525A;
}

.term-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.term-radio {
  display: none;
}

.term-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.term-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.term-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2A525A;
}

.custom-term {
  margin-top: 0.5rem;
}

.custom-term-input {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  width: 150px;
}

.gap-topup-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.gap-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.gap-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.gap-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.gap-terms {
  margin-top: 1rem;
}

.gap-term-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.gap-term-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.gap-term-highlighted {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.gap-term-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.gap-term-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2A525A;
}

.payment-method-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
}

.payment-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option:hover {
  border-color: #2A525A;
}

.payment-radio {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.summary-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-section {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-label {
  font-weight: 500;
  color: #6b7280;
}

.summary-value {
  font-weight: 600;
  color: #1f2937;
}

.coverage-list {
  margin: 0;
  padding-left: 1rem;
}

.cost-breakdown {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid #ffa242;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.cost-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2A525A;
}

.step-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spacer {
  flex: 1;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary {
  background: #ffa242;
  color: #2A525A;
}

.btn-primary:hover:not(:disabled) {
  background: #e6d700;
}

.btn-save {
  background: green;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #01d201;
}


.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

@media (max-width: 768px) {
  .policy-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .step-navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step-indicator {
    flex-direction: row;
    text-align: left;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-item {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .customer-lookup-form {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .customer-lookup-input {
    min-width: auto;
    width: 100%;
  }
}
</style>