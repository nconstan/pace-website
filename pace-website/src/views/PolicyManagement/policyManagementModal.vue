<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Edit Policy</h3>
        <button @click="$emit('close')" class="modal-close">
          <X class="close-icon" />
        </button>
      </div>
      
      <button @click="transferPolicy">Transfer</button>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Policy Information -->
        <div class="form-section">
          <h4 class="section-title">Policy Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="policy_number" class="form-label">
                <FileText class="label-icon" />
                Policy Number
              </label>
              <input
                id="policy_number"
                v-model="policyForm.policy_number.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('policy_number') }"
                placeholder="Policy number"
                @blur="markFieldAsTouched('policy_number')"
              />
              <div v-if="shouldShowError('policy_number')" class="error-message">{{ policyForm.policy_number.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="policy_status" class="form-label">
                <Shield class="label-icon" />
                Status
              </label>
              <select
                id="policy_status"
                v-model="policyForm.status.value"
                class="form-input"
                :class="{ 'error': shouldShowError('status') }"
                @blur="markFieldAsTouched('status')"
              >
                <option value="0">Pending</option>
                <option value="1">Confirmed</option>
                <option value="2">Cancelled</option>
              </select>
              <div v-if="shouldShowError('status')" class="error-message">{{ policyForm.status.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="policy_term" class="form-label">
                <Calendar class="label-icon" />
                Policy Term (months)
              </label>
              <input
                id="policy_term"
                v-model="policyForm.policy_term.value"
                type="number"
                class="form-input"
                :class="{ 'error': shouldShowError('policy_term') }"
                placeholder="36"
                @blur="markFieldAsTouched('policy_term')"
              />
              <div v-if="shouldShowError('policy_term')" class="error-message">{{ policyForm.policy_term.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="policy_price" class="form-label">
                <DollarSign class="label-icon" />
                Policy Price
              </label>
              <input
                id="policy_price"
                v-model="policyForm.policy_price.value"
                type="number"
                step="0.01"
                class="form-input"
                :class="{ 'error': shouldShowError('policy_price') }"
                placeholder="0.00"
                @blur="markFieldAsTouched('policy_price')"
              />
              <div v-if="shouldShowError('policy_price')" class="error-message">{{ policyForm.policy_price.validationErrors }}</div>
            </div>
          </div>
        </div>

        <!-- Applicant Information -->
        <div class="form-section">
          <h4 class="section-title">Applicant Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="first_name_1" class="form-label">
                <User class="label-icon" />
                First Name *
              </label>
              <input
                id="first_name_1"
                v-model="policyForm.first_name_1.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('first_name_1') }"
                placeholder="Enter first name"
                @blur="markFieldAsTouched('first_name_1')"
              />
              <div v-if="shouldShowError('first_name_1')" class="error-message">{{ policyForm.first_name_1.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="last_name_1" class="form-label">
                <User class="label-icon" />
                Last Name *
              </label>
              <input
                id="last_name_1"
                v-model="policyForm.last_name_1.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('last_name_1') }"
                placeholder="Enter last name"
                @blur="markFieldAsTouched('last_name_1')"
              />
              <div v-if="shouldShowError('last_name_1')" class="error-message">{{ policyForm.last_name_1.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="first_name_2" class="form-label">
                <User class="label-icon" />
                Secondary First Name
              </label>
              <input
                id="first_name_2"
                v-model="policyForm.first_name_2.value"
                type="text"
                class="form-input"
                placeholder="Enter secondary first name"
              />
            </div>
            
            <div class="form-group">
              <label for="last_name_2" class="form-label">
                <User class="label-icon" />
                Secondary Last Name
              </label>
              <input
                id="last_name_2"
                v-model="policyForm.last_name_2.value"
                type="text"
                class="form-input"
                placeholder="Enter secondary last name"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="email_1" class="form-label">
              <Mail class="label-icon" />
              Email *
            </label>
            <input
              id="email_1"
              v-model="policyForm.email_1.value"
              type="email"
              class="form-input"
              :class="{ 'error': shouldShowError('email_1') }"
              placeholder="Enter email"
              @blur="markFieldAsTouched('email_1')"
            />
            <div v-if="shouldShowError('email_1')" class="error-message">{{ policyForm.email_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="phone_number_1" class="form-label">
              <Phone class="label-icon" />
              Phone Number *
            </label>
            <input
              id="phone_number_1"
              v-model="policyForm.phone_number_1.value"
              type="tel"
              class="form-input"
              :class="{ 'error': shouldShowError('phone_number_1') }"
              placeholder="(555) 123-4567"
              @blur="markFieldAsTouched('phone_number_1')"
              @input="(event) => autoFormat(event, 'phone')"
            />
            <div v-if="shouldShowError('phone_number_1')" class="error-message">{{ policyForm.phone_number_1.validationErrors }}</div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="form-section">
          <h4 class="section-title">Address Information</h4>
          
          <div class="form-group">
            <label for="address_1" class="form-label">
              <MapPin class="label-icon" />
              Address Line 1 *
            </label>
            <input
              id="address_1"
              v-model="policyForm.address_1.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('address_1') }"
              placeholder="Enter street address"
              @blur="markFieldAsTouched('address_1')"
            />
            <div v-if="shouldShowError('address_1')" class="error-message">{{ policyForm.address_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="address_2" class="form-label">
              <MapPin class="label-icon" />
              Address Line 2
            </label>
            <input
              id="address_2"
              v-model="policyForm.address_2.value"
              type="text"
              class="form-input"
              placeholder="Enter apartment, suite, etc. (optional)"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="city" class="form-label">
                <MapPin class="label-icon" />
                City *
              </label>
              <input
                id="city"
                v-model="policyForm.city.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('city') }"
                placeholder="Enter city"
                @blur="markFieldAsTouched('city')"
              />
              <div v-if="shouldShowError('city')" class="error-message">{{ policyForm.city.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="province" class="form-label">
                <MapPin class="label-icon" />
                Province *
              </label>
              <select
                id="province"
                v-model="policyForm.province.value"
                class="form-input"
                :class="{ 'error': shouldShowError('province') }"
                @blur="markFieldAsTouched('province')"
              >
                <option value="">Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
              </select>
              <div v-if="shouldShowError('province')" class="error-message">{{ policyForm.province.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="postal_code" class="form-label">
              <MapPin class="label-icon" />
              Postal Code *
            </label>
            <input
              id="postal_code"
              v-model="policyForm.postal_code.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('postal_code') }"
              placeholder="A1A 1A1"
              @blur="markFieldAsTouched('postal_code')"
              @input="(event) => autoFormat(event, 'postalCode')"
            />
            <div v-if="shouldShowError('postal_code')" class="error-message">{{ policyForm.postal_code.validationErrors }}</div>
          </div>
        </div>

        <!-- Vehicle Information -->
        <div class="form-section">
          <h4 class="section-title">Vehicle Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="vin" class="form-label">
                <Car class="label-icon" />
                VIN *
              </label>
              <input
                id="vin"
                v-model="policyForm.VIN.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('VIN') }"
                placeholder="Enter VIN"
                @blur="markFieldAsTouched('VIN')"
              />
              <div v-if="shouldShowError('VIN')" class="error-message">{{ policyForm.VIN.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="odometer" class="form-label">
                <Car class="label-icon" />
                Odometer
              </label>
              <input
                id="odometer"
                v-model="policyForm.odometer.value"
                type="number"
                class="form-input"
                placeholder="Enter odometer reading"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="make" class="form-label">
                <Car class="label-icon" />
                Make *
              </label>
              <input
                id="make"
                v-model="policyForm.make.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('make') }"
                placeholder="Enter vehicle make"
                @blur="markFieldAsTouched('make')"
              />
              <div v-if="shouldShowError('make')" class="error-message">{{ policyForm.make.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="model" class="form-label">
                <Car class="label-icon" />
                Model *
              </label>
              <input
                id="model"
                v-model="policyForm.model.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('model') }"
                placeholder="Enter vehicle model"
                @blur="markFieldAsTouched('model')"
              />
              <div v-if="shouldShowError('model')" class="error-message">{{ policyForm.model.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="model_series" class="form-label">
                <Car class="label-icon" />
                Series
              </label>
              <input
                id="model_series"
                v-model="policyForm.model_series.value"
                type="text"
                class="form-input"
                placeholder="Enter vehicle series"
              />
            </div>
            
            <div class="form-group">
              <label for="model_year" class="form-label">
                <Car class="label-icon" />
                Model Year *
              </label>
              <input
                id="model_year"
                v-model="policyForm.model_year.value"
                type="number"
                class="form-input"
                :class="{ 'error': shouldShowError('model_year') }"
                placeholder="2024"
                @blur="markFieldAsTouched('model_year')"
              />
              <div v-if="shouldShowError('model_year')" class="error-message">{{ policyForm.model_year.validationErrors }}</div>
            </div>
          </div>
        </div>

        <!-- Debt Information -->
        <div class="form-section">
          <h4 class="section-title">Debt Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="total_debt" class="form-label">
                <DollarSign class="label-icon" />
                Total Debt
              </label>
              <input
                id="total_debt"
                v-model="policyForm.total_debt.value"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
              />
            </div>
            
            <div class="form-group">
              <label for="debt_interest_rate" class="form-label">
                <Percent class="label-icon" />
                Interest Rate (%)
              </label>
              <input
                id="debt_interest_rate"
                v-model="policyForm.debt_interest_rate.value"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="debt_term" class="form-label">
                <Calendar class="label-icon" />
                Debt Term (months)
              </label>
              <input
                id="debt_term"
                v-model="policyForm.debt_term.value"
                type="number"
                class="form-input"
                placeholder="0"
              />
            </div>
            
            <div class="form-group">
              <label for="loan_payments_monthly" class="form-label">
                <DollarSign class="label-icon" />
                Monthly Payment
              </label>
              <input
                id="loan_payments_monthly"
                v-model="policyForm.loan_payments_monthly.value"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="residual_value" class="form-label">
              <DollarSign class="label-icon" />
              Residual Value
            </label>
            <input
              id="residual_value"
              v-model="policyForm.residual_value.value"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-success" :disabled="!isFormValid">
            <Save class="btn-icon" />
            Update Policy
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'PolicyManagementModal',
}
</script>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { User, Mail, Phone, MapPin, FileText, Calendar, Shield, Car, DollarSign, Percent, X, Save } from 'lucide-vue-next'
import { autoValidate } from '../../Mixins/Rules'
import { autoFormat } from '../../Mixins/Validation/formattingRules'

interface Props {
  policy: any
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data with validation structure
const policyForm = reactive({
  // Policy fields
  policy_number: {value: '', touched: false, validationErrors: '', required: false},
  status: {value: '', touched: false, validationErrors: '', required: true},
  policy_term: {value: '', touched: false, validationErrors: '', required: true},
  policy_price: {value: '', touched: false, validationErrors: '', required: true},
  
  // Applicant fields
  first_name_1: {value: '', touched: false, validationErrors: '', required: true},
  last_name_1: {value: '', touched: false, validationErrors: '', required: true},
  first_name_2: {value: '', touched: false, validationErrors: '', required: false},
  last_name_2: {value: '', touched: false, validationErrors: '', required: false},
  email_1: {value: '', touched: false, validationErrors: '', required: true},
  phone_number_1: {value: '', touched: false, validationErrors: '', required: true},
  
  // Address fields
  address_1: {value: '', touched: false, validationErrors: '', required: true},
  address_2: {value: '', touched: false, validationErrors: '', required: false},
  city: {value: '', touched: false, validationErrors: '', required: true},
  province: {value: '', touched: false, validationErrors: '', required: true},
  postal_code: {value: '', touched: false, validationErrors: '', required: true},
  
  // Vehicle fields
  VIN: {value: '', touched: false, validationErrors: '', required: true},
  odometer: {value: '', touched: false, validationErrors: '', required: false},
  make: {value: '', touched: false, validationErrors: '', required: true},
  model: {value: '', touched: false, validationErrors: '', required: true},
  model_series: {value: '', touched: false, validationErrors: '', required: false},
  model_year: {value: '', touched: false, validationErrors: '', required: true},
  
  // Debt fields
  total_debt: {value: '', touched: false, validationErrors: '', required: false},
  debt_interest_rate: {value: '', touched: false, validationErrors: '', required: false},
  debt_term: {value: '', touched: false, validationErrors: '', required: false},
  loan_payments_monthly: {value: '', touched: false, validationErrors: '', required: false},
  residual_value: {value: '', touched: false, validationErrors: '', required: false},
})

const transferPolicy = () => {
  // Navigate to policy creation with the policy ID as a parameter
  window.location.href = `/dashboard/policy-creation?policyId=${props.policy.id}`
}

// Validation functions
const markFieldAsTouched = (fieldName: string) => {
  policyForm[fieldName as keyof typeof policyForm].touched = true
  validateField(fieldName)
}

const validateField = (fieldName: string) => {
  const value = policyForm[fieldName as keyof typeof policyForm].value
  policyForm[fieldName as keyof typeof policyForm].validationErrors = autoValidate(value, fieldName).message
}

const shouldShowError = (fieldName: string) => {
  return policyForm[fieldName as keyof typeof policyForm].touched && policyForm[fieldName as keyof typeof policyForm].validationErrors
}

const validateForm = () => {
  // Check if all required fields are valid (only for touched fields)
  for (const field in policyForm) {
    if (policyForm[field as keyof typeof policyForm].required || policyForm[field as keyof typeof policyForm].value) {
      validateField(field)
      if (policyForm[field as keyof typeof policyForm].validationErrors) {
        return false
      }
    }
  }
  return true
}

const isFormValid = computed(() => {
  return validateForm()
})

const handleSubmit = () => {
  // Mark all fields as touched and validate them
  Object.keys(policyForm).forEach(key => {
    if(policyForm[key as keyof typeof policyForm].required || policyForm[key as keyof typeof policyForm].value){
      policyForm[key as keyof typeof policyForm].touched = true
      validateField(key)
    }
  })
  
  // Check if form is valid after validation
  if (!isFormValid.value) {
    return
  }
  
  // Format data for submission
  let submitData: any = {}
  Object.keys(policyForm).forEach(key => {
    submitData[key] = policyForm[key as keyof typeof policyForm].value
    if(typeof submitData[key] === 'string') submitData[key] = submitData[key].trim()
  })
  
  // Convert numeric fields
  if (submitData.policy_term) submitData.policy_term = parseInt(submitData.policy_term)
  if (submitData.policy_price) submitData.policy_price = parseFloat(submitData.policy_price)
  if (submitData.odometer) submitData.odometer = parseInt(submitData.odometer)
  if (submitData.model_year) submitData.model_year = parseInt(submitData.model_year)
  if (submitData.total_debt) submitData.total_debt = parseFloat(submitData.total_debt)
  if (submitData.debt_interest_rate) submitData.debt_interest_rate = parseFloat(submitData.debt_interest_rate)
  if (submitData.debt_term) submitData.debt_term = parseInt(submitData.debt_term)
  if (submitData.loan_payments_monthly) submitData.loan_payments_monthly = parseFloat(submitData.loan_payments_monthly)
  if (submitData.residual_value) submitData.residual_value = parseFloat(submitData.residual_value)
  if (submitData.status) submitData.status = parseInt(submitData.status)

  emit('save', submitData)
}

// Load data when component mounts
onMounted(() => {
  if (props.policy) {
    // Load policy data
    policyForm.policy_number.value = props.policy.id?.toString().padStart(6, '0') || ''
    policyForm.status.value = props.policy.status?.toString() || '0'
    policyForm.policy_term.value = props.policy.policy_term?.toString() || ''
    policyForm.policy_price.value = props.policy.policy_price?.toString() || ''
    
    // Load applicant data
    if (props.policy.applicants && props.policy.applicants.length > 0) {
      const applicant = props.policy.applicants[0]
      policyForm.first_name_1.value = applicant.first_name_1 || ''
      policyForm.last_name_1.value = applicant.last_name_1 || ''
      policyForm.first_name_2.value = applicant.first_name_2 || ''
      policyForm.last_name_2.value = applicant.last_name_2 || ''
      policyForm.email_1.value = applicant.email_1 || ''
      policyForm.phone_number_1.value = applicant.phone_number_1 || ''
      policyForm.address_1.value = applicant.address_1 || ''
      policyForm.address_2.value = applicant.address_2 || ''
      policyForm.city.value = applicant.city || ''
      policyForm.province.value = applicant.province || ''
      policyForm.postal_code.value = applicant.postal_code || ''
    }
    
    // Load vehicle data
    policyForm.VIN.value = props.policy.VIN || ''
    policyForm.odometer.value = props.policy.odometer?.toString() || ''
    policyForm.make.value = props.policy.make || ''
    policyForm.model.value = props.policy.model || ''
    policyForm.model_series.value = props.policy.model_series || ''
    policyForm.model_year.value = props.policy.model_year?.toString() || ''
    
    // Load debt data
    policyForm.total_debt.value = props.policy.total_debt?.toString() || ''
    policyForm.debt_interest_rate.value = props.policy.debt_interest_rate?.toString() || ''
    policyForm.debt_term.value = props.policy.debt_term?.toString() || ''
    policyForm.loan_payments_monthly.value = props.policy.loan_payments_monthly?.toString() || ''
    policyForm.residual_value.value = props.policy.residual_value?.toString() || ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 60%;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.label-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #2A525A;
}

.form-input.error {
  border-color: #ef4444;
}

/* Select element styling */
select.form-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  appearance: none;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
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

.btn-success:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-content {
    max-width: 95%;
  }
}
</style>
