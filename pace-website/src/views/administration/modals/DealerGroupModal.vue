<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? 'Edit Dealer Group' : 'Create Dealer Group' }}
        </h3>
        <button @click="$emit('close')" class="modal-close">
          <X class="close-icon" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Business Information -->
        <div class="form-section">
          <h4 class="section-title">Business Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="fullName" class="form-label">
                <Building class="label-icon" />
                Full Name *
              </label>
              <input
                id="fullName"
                v-model="dealerGroupForm.full_name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('full_name') }"
                placeholder="Enter full business name"
                @blur="markFieldAsTouched('full_name')"
              />
              <div v-if="shouldShowError('full_name')" class="error-message">{{ dealerGroupForm.full_name.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="nickname" class="form-label">
                <FileText class="label-icon" />
                Nickname
              </label>
              <input
                id="nickname"
                v-model="dealerGroupForm.nickname.value"
                type="text"
                class="form-input"
                placeholder="Enter nickname (optional)"
              />
            </div>
          </div>
        </div>

        <!-- Financial Information -->
        <div class="form-section">
          <h4 class="section-title">Financial Information</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="dealerMargin" class="form-label">
                <DollarSign class="label-icon" />
                Dealer Margin (%) *
              </label>
              <input
                id="dealerMargin"
                v-model="dealerGroupForm.dealer_margin.value"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="form-input"
                :class="{ 'error': shouldShowError('dealer_margin') }"
                placeholder="0.00"
                @blur="markFieldAsTouched('dealer_margin')"
              />
              <div v-if="shouldShowError('dealer_margin')" class="error-message">{{ dealerGroupForm.dealer_margin.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="dealerGroupSplit" class="form-label">
                <Percent class="label-icon" />
                Dealer Group Split (%) *
              </label>
              <input
                id="dealerGroupSplit"
                v-model="dealerGroupForm.dealer_group_split.value"
                type="number"
                min="0"
                max="100"
                class="form-input"
                :class="{ 'error': shouldShowError('dealer_group_split') }"
                placeholder="0"
                @blur="markFieldAsTouched('dealer_group_split')"
              />
              <div v-if="shouldShowError('dealer_group_split')" class="error-message">{{ dealerGroupForm.dealer_group_split.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="referralFeeRate" class="form-label">
              <DollarSign class="label-icon" />
              Referral Fee Rate *
            </label>
            <input
              id="referralFeeRate"
              v-model="dealerGroupForm.referral_fee_rate.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('referral_fee_rate') }"
              placeholder="Enter referral fee rate"
              @blur="markFieldAsTouched('referral_fee_rate')"
            />
            <div v-if="shouldShowError('referral_fee_rate')" class="error-message">{{ dealerGroupForm.referral_fee_rate.validationErrors }}</div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="form-section">
          <h4 class="section-title">Address Information</h4>
          
          <div class="form-group">
            <label for="address1" class="form-label">
              <MapPin class="label-icon" />
              Address Line 1 *
            </label>
            <input
              id="address1"
              v-model="dealerGroupForm.address_1.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('address_1') }"
              placeholder="Enter street address"
              @blur="markFieldAsTouched('address_1')"
            />
            <div v-if="shouldShowError('address_1')" class="error-message">{{ dealerGroupForm.address_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="address2" class="form-label">
              <MapPin class="label-icon" />
              Address Line 2
            </label>
            <input
              id="address2"
              v-model="dealerGroupForm.address_2.value"
              type="text"
              class="form-input"
              placeholder="Enter apartment, suite, etc. (optional)"
            />
          </div>
          
          <div class="form-group">
            <label for="postalCode" class="form-label">
              <MapPin class="label-icon" />
              Postal Code *
            </label>
            <input
              id="postalCode"
              v-model="dealerGroupForm.postal_code.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('postal_code') }"
              placeholder="A1A 1A1"
              @blur="markFieldAsTouched('postal_code')"
              @input="(event) => autoFormat(event, 'postalCode')"
            />
            <div v-if="shouldShowError('postal_code')" class="error-message">{{ dealerGroupForm.postal_code.validationErrors }}</div>
          </div>
        </div>

        <!-- Contact Management Section -->
        <div class="form-section">
          <h4 class="section-title">Contact Information</h4>
          <ContactManagement 
            entity-type="dealer group"
            :contacts="contacts"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-success" :disabled="!isFormValid">
            <Save class="btn-icon" />
            {{ isEditing ? 'Update' : 'Create' }} Group
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'DealerGroupModal'
}
</script>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { validationRules, autoValidate } from '../../../Mixins/Rules'
import { autoFormat } from '../../../Mixins/Validation/formattingRules'
import ContactManagement from '../ContactManagement.vue'

interface Props {
  isEditing: boolean
  dealerGroup?: any
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
void props
const emit = defineEmits<Emits>()

// Form data
const dealerGroupForm = reactive({
  full_name: {value: '', touched: false, validationErrors: '', required: true},
  nickname: {value: '', touched: false, validationErrors: '', required: false},
  dealer_margin: {value: '', touched: false, validationErrors: '', required: true},
  dealer_group_split: {value: '', touched: false, validationErrors: '', required: true},
  referral_fee_rate: {value: '', touched: false, validationErrors: '', required: true},
  address_1: {value: '', touched: false, validationErrors: '', required: true},
  address_2: {value: '', touched: false, validationErrors: '', required: false},
  postal_code: {value: '', touched: false, validationErrors: '', required: true},
})

const contacts = reactive({
  primary: {value: undefined, touched: false, validationErrors: '', required: true},
  secondary: {value: [], touched: false, validationErrors: '', required: false}
})

// Validation functions
const markFieldAsTouched = (fieldName: string) => {
  dealerGroupForm[fieldName as keyof typeof dealerGroupForm].touched = true
  validateField(fieldName)
}

const validateField = (fieldName: string) => {
  const value = dealerGroupForm[fieldName as keyof typeof dealerGroupForm].value
  
  switch (fieldName) {
    case 'dealer_margin':
      const marginValidation = validationRules.number(value, 0, 100)
      dealerGroupForm[fieldName as keyof typeof dealerGroupForm].validationErrors = marginValidation.message
      break
    case 'dealer_group_split':
      const splitValidation = validationRules.number(value, 0, 100)
      dealerGroupForm[fieldName as keyof typeof dealerGroupForm].validationErrors = splitValidation.message
      break
    case 'referral_fee_rate':
      const rateValidation = validationRules.required(value)
      dealerGroupForm[fieldName as keyof typeof dealerGroupForm].validationErrors = rateValidation.message
      break
    default:
      dealerGroupForm[fieldName as keyof typeof dealerGroupForm].validationErrors = autoValidate(value, fieldName).message
      break
  }
}

const shouldShowError = (fieldName: string) => {
  return dealerGroupForm[fieldName as keyof typeof dealerGroupForm].touched && dealerGroupForm[fieldName as keyof typeof dealerGroupForm].validationErrors
}

const validateForm = () => {
  // Check if primary contact is selected
  if (!contacts.primary.value) {
    return false
  }
  
  // Check if all required fields are valid (only for touched fields)
  for (const field in dealerGroupForm) {
    if (dealerGroupForm[field as keyof typeof dealerGroupForm].required || dealerGroupForm[field as keyof typeof dealerGroupForm].value) {
      validateField(field)
      if (dealerGroupForm[field as keyof typeof dealerGroupForm].validationErrors) {
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
  Object.keys(dealerGroupForm).forEach(key => {
    if(dealerGroupForm[key as keyof typeof dealerGroupForm].required || dealerGroupForm[key as keyof typeof dealerGroupForm].value){
      dealerGroupForm[key as keyof typeof dealerGroupForm].touched = true
      validateField(key)
    }
  })
  
  // Check if form is valid after validation
  if (!isFormValid.value) {
    return
  }
  // Format data for submission
  let submitData: any = {}
  console.log("what0", dealerGroupForm)
  Object.keys(dealerGroupForm).forEach(key => {
    submitData[key] = dealerGroupForm[key as keyof typeof dealerGroupForm].value
    console.log("what1", key)
    console.log("what2", submitData[key])
    console.log("what4", dealerGroupForm[key as keyof typeof dealerGroupForm], dealerGroupForm[key as keyof typeof dealerGroupForm].value)
    if(typeof submitData[key] === 'string') submitData[key] = submitData[key].trim()
    if(typeof submitData[key] === 'number' && submitData[key] % 1 === 0) submitData[key] = parseInt(submitData[key].toString())
    if(typeof submitData[key] === 'number' && submitData[key] % 1 !== 0) submitData[key] = parseFloat(submitData[key].toString())
  })
console.log("final", submitData)
  submitData.primary_contact_data = contacts.primary.value
  submitData.secondary_contact_data = contacts.secondary.value

  emit('save', submitData)
}
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
  max-width: 50%;
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

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2A525A;
}

.form-input.error,
.form-textarea.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

.btn-primary {
  background: #ffa242;
  color: #2A525A;
}

.btn-primary:hover {
  background: #e6d700;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.no-contacts {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
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
  
  .contact-placeholder {
    flex-direction: column;
  }
}
</style>
