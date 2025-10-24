<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? 'Edit Dealership' : 'Create Dealership' }}
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
              <label for="name" class="form-label">
                <Building class="label-icon" />
                Dealership Name *
              </label>
              <input
                id="name"
                v-model="dealershipForm.name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('name') }"
                placeholder="Enter dealership name"
                @blur="markFieldAsTouched('name')"
              />
              <div v-if="shouldShowError('name')" class="error-message">{{ dealershipForm.name.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="nickname" class="form-label">
                <FileText class="label-icon" />
                Nickname
              </label>
              <input
                id="nickname"
                v-model="dealershipForm.nickname.value"
                type="text"
                class="form-input"
                placeholder="Enter nickname (optional)"
              />
            </div>
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
              v-model="dealershipForm.address_1.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('address_1') }"
              placeholder="Enter street address"
              @blur="markFieldAsTouched('address_1')"
            />
            <div v-if="shouldShowError('address_1')" class="error-message">{{ dealershipForm.address_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="address2" class="form-label">
              <MapPin class="label-icon" />
              Address Line 2
            </label>
            <input
              id="address2"
              v-model="dealershipForm.address_2.value"
              type="text"
              class="form-input"
              placeholder="Enter apartment, suite, etc. (optional)"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="province" class="form-label">
                <MapPin class="label-icon" />
                Province *
              </label>
              <input
                id="province"
                v-model="dealershipForm.province.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('province') }"
                placeholder="Enter province"
                @blur="markFieldAsTouched('province')"
              />
              <div v-if="shouldShowError('province')" class="error-message">{{ dealershipForm.province.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="city" class="form-label">
                <MapPin class="label-icon" />
                City *
              </label>
              <input
                id="city"
                v-model="dealershipForm.city.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('city') }"
                placeholder="Enter city"
                @blur="markFieldAsTouched('city')"
              />
              <div v-if="shouldShowError('city')" class="error-message">{{ dealershipForm.city.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="postalCode" class="form-label">
                <MapPin class="label-icon" />
                Postal Code *
              </label>
              <input
                id="postalCode"
                v-model="dealershipForm.postal_code.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('postal_code') }"
                placeholder="A1A 1A1"
                @blur="markFieldAsTouched('postal_code')"
                @input="(event) => autoFormat(event, 'postalCode')"
              />
              <div v-if="shouldShowError('postal_code')" class="error-message">{{ dealershipForm.postal_code.validationErrors }}</div>
            </div>
          </div>
        </div>
                 <!-- Dealer Group Selection (for role 4 users) -->
         <div v-if="showDealerGroupSection" class="form-section">
          <h4 class="section-title">Dealer Group Assignment</h4>
          <div class="form-group">
            <label for="dealerGroup" class="form-label">
              <Building class="label-icon" />
              Dealer Group *
            </label>
            <select
              id="dealerGroup"
              v-model="selectedDealerGroup"
              class="form-input"
              :class="{ 'error': !selectedDealerGroup }"              
            >
              <option value="">Select a dealer group</option>
              <option 
                v-for="group in managementStore.dealerGroups" 
                :key="group.id" 
                :value="group"
              >
                {{ group.name }}
              </option>
            </select>
            <div v-if="!selectedDealerGroup" class="error-message">Please select a dealer group</div>
          </div>
        </div>

        <!-- Contact Management Section -->
        <div class="form-section">
          <h4 class="section-title">Contact Information</h4>
          <ContactManagement 
            entity-type="dealership"
            :contacts="contacts"
            :showAddOrganizationContacts="true"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-success" :disabled="!isFormValid">
            <Save class="btn-icon" />
            {{ isEditing ? 'Update' : 'Create' }} Dealership
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'DealershipModal'
}
</script>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { Building, MapPin, FileText, X, Save } from 'lucide-vue-next'
import { autoValidate } from '../../../Mixins/Rules'
import { autoFormat } from '../../../Mixins/Validation/formattingRules'
import ContactManagement from '../ContactManagement.vue'
import { useAuthStore } from '../../../stores/auth'
import { useManagementStore } from '../../../stores/management'

interface Props {
  isEditing: boolean
  dealership?: any
  userRole: number
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const authStore = useAuthStore()
const managementStore = useManagementStore()

// Dealer group selection for role 4 users
const selectedDealerGroup = ref<any>(null)
const showDealerGroupSection = ref(false)

// Form data
const dealershipForm = reactive({
  name: {value: '', touched: false, validationErrors: '', required: true},
  nickname: {value: '', touched: false, validationErrors: '', required: false},
  address_1: {value: '', touched: false, validationErrors: '', required: true},
  address_2: {value: '', touched: false, validationErrors: '', required: false},
  province: {value: '', touched: false, validationErrors: '', required: true},
  city: {value: '', touched: false, validationErrors: '', required: true},
  postal_code: {value: '', touched: false, validationErrors: '', required: true},
})

const contacts = reactive({
  primary: {value: undefined, touched: false, validationErrors: '', required: true},
  secondary: {value: [], touched: false, validationErrors: '', required: false}
})

// Validation functions
const markFieldAsTouched = (fieldName: string) => {
  dealershipForm[fieldName as keyof typeof dealershipForm].touched = true
  validateField(fieldName)
}

const validateField = (fieldName: string) => {
  const value = dealershipForm[fieldName as keyof typeof dealershipForm].value
  console.log("validating field", fieldName, value)
  dealershipForm[fieldName as keyof typeof dealershipForm].validationErrors = autoValidate(value, fieldName).message
}

const shouldShowError = (fieldName: string) => {
  return dealershipForm[fieldName as keyof typeof dealershipForm].touched && dealershipForm[fieldName as keyof typeof dealershipForm].validationErrors
}

const validateForm = () => {
  // Check if primary contact is selected
  console.log("contacts.primary.value", contacts.primary.value)
  if (!contacts.primary.value) {
    return false
  }
  
  // Check if dealer group is selected for role 4 users
  if (showDealerGroupSection.value && !selectedDealerGroup.value) {
    return false
  }
  
  // Check if all required fields are valid (only for touched fields)
  for (const field in dealershipForm) {
    if (dealershipForm[field as keyof typeof dealershipForm].required || dealershipForm[field as keyof typeof dealershipForm].value) {
      validateField(field)
      if (dealershipForm[field as keyof typeof dealershipForm].validationErrors) {
        console.log("unvalidated field", field)
        return false
      }
    }
  }
  return true
}

const isFormValid = computed(() => {
  return validateForm()
})

// Check user role and initialize dealer group section
const initializeDealerGroupSection = async () => {
  try {
    const hasRequiredRole = await authStore.hasRole([4])
    showDealerGroupSection.value = hasRequiredRole
  } catch (error) {
    console.error('Error checking user role:', error)
    showDealerGroupSection.value = false
  }
}


const handleSubmit = () => {
  // Mark all fields as touched and validate them
  Object.keys(dealershipForm).forEach(key => {
    if(dealershipForm[key as keyof typeof dealershipForm].required || dealershipForm[key as keyof typeof dealershipForm].value){
      dealershipForm[key as keyof typeof dealershipForm].touched = true
      validateField(key)
    }
  })
  
  // Check if form is valid after validation
  if (!isFormValid.value) {
    return
  }
  
  // Format data for submission
  let submitData: any = {}
  Object.keys(dealershipForm).forEach(key => {
    submitData[key] = dealershipForm[key as keyof typeof dealershipForm].value
    if(typeof submitData[key] === 'string') submitData[key] = submitData[key].trim()
  })
  if(contacts.primary.value){
    submitData.primary_contact_ids = (contacts.primary.value as any).id
  }else{
    return
  }

  if(contacts.secondary.value){
    submitData.secondary_contact_ids = contacts.secondary.value.map((contact: any) => contact.id)
  }

  // Add dealer group data for role 4 users
  if (showDealerGroupSection.value && selectedDealerGroup.value) {
    submitData.dealer_group_id = selectedDealerGroup.value.id
  }

  emit('save', submitData)
}

// Load dealer groups when component mounts
onMounted(() => {
  initializeDealerGroupSection()
  console.log("dealership from modal", props.dealership)
  if(props.isEditing){
    Object.keys(dealershipForm).forEach(key => {dealershipForm[key as keyof typeof dealershipForm].value = props.dealership[key]})
    console.log("dealership from modal", props.dealership.dealer_group)
    selectedDealerGroup.value = managementStore.dealerGroups.find(group => group.id === props.dealership.dealer_group.id)
    console.log("selectedDealerGroup", selectedDealerGroup.value)
    contacts.primary.value = props.dealership.primary_contact
    contacts.secondary.value = props.dealership.secondary_contacts
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
}
</style>
