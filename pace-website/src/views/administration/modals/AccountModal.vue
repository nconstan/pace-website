<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? 'Edit Account' : 'Create Account' }}
        </h3>
        <button @click="$emit('close')" class="modal-close">
          <X class="close-icon" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Personal Information -->
        <div class="form-section">
          <h4 class="section-title">Personal Information</h4>
          
          <div class="form-group" v-if="!isEditing">
            <label for="username" class="form-label">
              <User class="label-icon" />
              Username *
            </label>
            <input
              id="username"
              v-model="accountForm.username.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('username') }"
              placeholder="Enter username"
              @blur="markFieldAsTouched('username')"
            />
            <div v-if="shouldShowError('username')" class="error-message">{{ accountForm.username.validationErrors }}</div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="first_name" class="form-label">
                <User class="label-icon" />
                First Name *
              </label>
              <input
                id="first_name"
                v-model="accountForm.first_name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('first_name') }"
                placeholder="Enter first name"
                @blur="markFieldAsTouched('first_name')"
              />
              <div v-if="shouldShowError('first_name')" class="error-message">{{ accountForm.first_name.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="last_name" class="form-label">
                <User class="label-icon" />
                Last Name *
              </label>
              <input
                id="last_name"
                v-model="accountForm.last_name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('last_name') }"
                placeholder="Enter last name"
                @blur="markFieldAsTouched('last_name')"
              />
              <div v-if="shouldShowError('last_name')" class="error-message">{{ accountForm.last_name.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="nickname" class="form-label">
              <FileText class="label-icon" />
              Nickname
            </label>
            <input
              id="nickname"
              v-model="accountForm.nickname.value"
              type="text"
              class="form-input"
              placeholder="Enter nickname (optional)"
            />
          </div>
          
          <div class="form-group">
            <label for="birthday" class="form-label">
              <Calendar class="label-icon" />
              Birthday
            </label>
            <input
              id="birthday"
              v-model="accountForm.birthday.value"
              type="date"
              class="form-input"
              placeholder="Select birthday"
            />
          </div>
        </div>

        <!-- Contact Information -->
        <div class="form-section">
          <h4 class="section-title">Contact Information</h4>
          
          <div class="form-group">
            <label for="primary_email" class="form-label">
              <Mail class="label-icon" />
              Primary Email *
            </label>
            <input
              id="primary_email"
              v-model="accountForm.primary_email.value"
              type="email"
              class="form-input"
              :class="{ 'error': shouldShowError('primary_email') }"
              placeholder="Enter primary email"
              @blur="markFieldAsTouched('primary_email')"
            />
            <div v-if="shouldShowError('primary_email')" class="error-message">{{ accountForm.primary_email.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="secondary_email" class="form-label">
              <Mail class="label-icon" />
              Secondary Email
            </label>
            <input
              id="secondary_email"
              v-model="accountForm.secondary_email.value"
              type="email"
              class="form-input"
              placeholder="Enter secondary email (optional)"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="primary_phone" class="form-label">
                <Phone class="label-icon" />
                Primary Phone *
              </label>
              <input
                id="primary_phone"
                v-model="accountForm.primary_phone_number.value"
                type="tel"
                class="form-input"
                :class="{ 'error': shouldShowError('primary_phone_number') }"
                placeholder="(555) 123-4567"
                @blur="markFieldAsTouched('primary_phone_number')"
                @input="autoFormat($event, 'phone')"
              />
              <div v-if="shouldShowError('primary_phone_number')" class="error-message">{{ accountForm.primary_phone_number.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="secondary_phone" class="form-label">
                <Phone class="label-icon" />
                Secondary Phone
              </label>
              <input
                id="secondary_phone"
                v-model="accountForm.secondary_phone_number.value"
                type="tel"
                class="form-input"
                placeholder="(555) 123-4567"
                @input="autoFormat($event, 'phone')"
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
              v-model="accountForm.address_1.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('address_1') }"
              placeholder="Enter street address"
              @blur="markFieldAsTouched('address_1')"
            />
            <div v-if="shouldShowError('address_1')" class="error-message">{{ accountForm.address_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="address2" class="form-label">
              <MapPin class="label-icon" />
              Address Line 2
            </label>
            <input
              id="address2"
              v-model="accountForm.address_2.value"
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
                v-model="accountForm.city.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('city') }"
                placeholder="Enter city"
                @blur="markFieldAsTouched('city')"
              />
              <div v-if="shouldShowError('city')" class="error-message">{{ accountForm.city.validationErrors }}</div>
            </div>
            
            <div class="form-group">
              <label for="province" class="form-label">
                <MapPin class="label-icon" />
                Province *
              </label>
              <select
                id="province"
                v-model="accountForm.province.value"
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
              <div v-if="shouldShowError('province')" class="error-message">{{ accountForm.province.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="postalCode" class="form-label">
              <MapPin class="label-icon" />
              Postal Code *
            </label>
            <input
              id="postalCode"
              v-model="accountForm.postal_code.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('postal_code') }"
              placeholder="A1A 1A1"
              @blur="markFieldAsTouched('postal_code')"
              @input="autoFormat($event, 'postalCode')"
            />
            <div v-if="shouldShowError('postal_code')" class="error-message">{{ accountForm.postal_code.validationErrors }}</div>
          </div>
        </div>

                 <!-- Role and Access -->
         <div class="form-section">
           <h4 class="section-title">Role and Access</h4>
           
           <div class="form-group">
             <label class="form-label">
               <Shield class="label-icon" />
               Roles *
             </label>
             <div class="role-checkboxes">
               <label
                 v-for="role in availableRoles"
                 :key="role"
                 class="checkbox-label"
               >
                 <input
                   type="checkbox"
                   :value="role"
                   v-model="selectedRoles"
                   @change="handleRoleChange"
                   class="checkbox-input"
                 />
                 <span class="checkbox-text">{{ getRoleName(role) }}</span>
               </label>
             </div>
             <div v-if="shouldShowError('roles')" class="error-message">{{ accountForm.roles.validationErrors }}</div>
           </div>
         </div>
         <!-- Dealer Group Selection (Only for Role 4 and 12) -->
         <div v-if="canSetDealerGroup && [3,2,1].includes(parseInt(selectedRoles[0] || '0'))" class="form-section">
           <h4 class="section-title">Dealer Group Assignment</h4>
           
           <div class="form-group">
             <label for="dealer_group" class="form-label">
               <Building class="label-icon" />
               Dealer Group
             </label>
             <select
               id="dealer_group"
               v-model="selectedDealerGroup"
               class="form-input"
               @change="handleDealerGroupChange"
             >
               <option value="">Select Dealer Group (Optional)</option>
               <option 
                 v-for="group in dealerGroups" 
                 :key="group.id" 
                 :value="group.id"
               >
                 {{ group.name }}
               </option>
             </select>
           </div>
         </div>

        <!-- Associated Dealerships -->
        <div v-if="[3,2,1].includes(parseInt(selectedRoles[0] || '0'))" class="form-section">
          <h4 class="section-title">Associated Dealerships</h4>
          
          <div class="form-group">
            <label class="form-label">
              <Building class="label-icon" />
              Select Dealerships
            </label>
            <div class="dealership-checkboxes">
              <label
                v-for="dealership in filteredDealerships"
                :key="dealership.id"
                class="checkbox-label"
              >
                <input
                  type="checkbox"
                  :checked="selectedDealerships.includes(dealership.id)"
                  @change="toggleDealership(dealership.id)"
                  class="checkbox-input"
                />
                <span class="checkbox-text">{{ dealership.name }} ({{ dealership.province }})</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-success" :disabled="!isFormValid">
            <Save class="btn-icon" />
            {{ isEditing ? 'Update' : 'Create' }} Account
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AccountModal'
}
</script>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { User, Mail, Phone, MapPin, FileText, Calendar, Shield, Building, X, Save } from 'lucide-vue-next'
import { autoValidate } from '../../../Mixins/Rules'
import { autoFormat } from '../../../Mixins/Validation/formattingRules'
import { useAuthStore } from '../../../stores/auth'
import { useManagementStore } from '../../../stores/management'
import { roles } from '../../../Mixins/constants'

const icons = { User, Mail, Phone, MapPin, FileText, Calendar, Shield, Building, X, Save }
void icons

interface Props {
  isEditing: boolean
  account?: any
  userRole: number
  dealerships: any[]
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const authStore = useAuthStore()
const managementStore = useManagementStore()

// Selected dealerships
const selectedDealerships = ref<string[]>([])

// Selected roles
const selectedRoles = ref<string[]>([])

// Selected dealer group
const selectedDealerGroup = ref<string>('')

// Check if user can set dealer group (Role 4 or 12)
const canSetDealerGroup = computed(() => {
  const userRoles = authStore.user?.roles || []
  return userRoles.includes(4) || userRoles.includes(12)
})

// Get dealer groups from management store
const dealerGroups = computed(() => managementStore.dealerGroups || [])

// Available roles based on user permissions
const availableRoles = computed(() => {
  const userRoles = authStore.user?.roles || []
  const userHighestRole = Math.max(...userRoles)
  
  // Role 2 can only assign roles 1 or 2
  if (userHighestRole === 2) {
    return [1, 2]
  }
  // Role 3 can assign roles 1, 2, or 3
  else if (userHighestRole === 3) {
    return [1, 2, 3]
  }
  // Role 4 can assign roles 1, 2, 3, or 4
  else if (userHighestRole === 4) {
    return [1, 2, 3, 4]
  }
  // Role 12 can assign all roles
  else if (userHighestRole === 12) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
  }
  
  return []
})

// Form data with validation structure
const accountForm = reactive({
  username: {value: '', touched: false, validationErrors: '', required: true},
  first_name: {value: '', touched: false, validationErrors: '', required: true},
  last_name: {value: '', touched: false, validationErrors: '', required: true},
  nickname: {value: '', touched: false, validationErrors: '', required: false},
  primary_email: {value: '', touched: false, validationErrors: '', required: true},
  secondary_email: {value: '', touched: false, validationErrors: '', required: false},
  primary_phone_number: {value: '', touched: false, validationErrors: '', required: true},
  secondary_phone_number: {value: '', touched: false, validationErrors: '', required: false},
  address_1: {value: '', touched: false, validationErrors: '', required: true},
  address_2: {value: '', touched: false, validationErrors: '', required: false},
  city: {value: '', touched: false, validationErrors: '', required: true},
  province: {value: '', touched: false, validationErrors: '', required: true},
  postal_code: {value: '', touched: false, validationErrors: '', required: true},
  birthday: {value: '', touched: false, validationErrors: '', required: false},
  roles: {value: '', touched: false, validationErrors: '', required: true},
})

// Filter dealerships based on user role
const filteredDealerships = computed(() => {
  // If a dealer group is selected, filter dealerships to only show those from that dealer group
  if (selectedDealerGroup.value) {
    return props.dealerships.filter(dealership => 
      dealership.dealer_group?.id?.toString() === selectedDealerGroup.value.toString()
    )
  }
  
  // If no dealer group is selected, show all dealerships
  return props.dealerships
})

// Validation functions
const markFieldAsTouched = (fieldName: string) => {
  accountForm[fieldName as keyof typeof accountForm].touched = true
  validateField(fieldName)
}

const validateField = (fieldName: string) => {
  const value = accountForm[fieldName as keyof typeof accountForm].value
  accountForm[fieldName as keyof typeof accountForm].validationErrors = autoValidate(value, fieldName).message
}

const shouldShowError = (fieldName: string) => {
  return accountForm[fieldName as keyof typeof accountForm].touched && accountForm[fieldName as keyof typeof accountForm].validationErrors
}

const validateForm = () => {
  // Check if at least one dealership is selected
  if (selectedDealerships.value.length === 0) {
    return false
  }
  
  // Check if at least one role is selected
  if (selectedRoles.value.length === 0) {
    return false
  }
  
  // Check if all required fields are valid (only for touched fields)
  for (const field in accountForm) {
    if (accountForm[field as keyof typeof accountForm].required || accountForm[field as keyof typeof accountForm].value) {
      validateField(field)
      if (accountForm[field as keyof typeof accountForm].validationErrors) {
        console.log("invald", field)
        return false
      }
    }
  }
  return true
}

const isFormValid = computed(() => {
  return validateForm()
})

const toggleDealership = (dealershipId: string) => {
  const index = selectedDealerships.value.indexOf(dealershipId)
  if (index > -1) {
    selectedDealerships.value.splice(index, 1)
  } else {
    selectedDealerships.value.push(dealershipId)
  }
}

const getRoleName = (role: number) => {
  return roles[role as keyof typeof roles] || `Role ${role}`
}

const handleRoleChange = () => {
  if(selectedRoles.value.some(role => [1, 2, 3].includes(parseInt(role)))) {
    const lastRole = selectedRoles.value[selectedRoles.value.length - 1]
    if (lastRole) {
      selectedRoles.value = [lastRole]
    }
  }
  validateField('roles')
}

const handleDealerGroupChange = () => {
  selectedDealerships.value = []
}


const handleSubmit = () => {
  // Mark all fields as touched and validate them
  Object.keys(accountForm).forEach(key => {
    if(accountForm[key as keyof typeof accountForm].required || accountForm[key as keyof typeof accountForm].value){
      accountForm[key as keyof typeof accountForm].touched = true
      validateField(key)
    }
  })
  
  // Check if form is valid after validation
  if (!isFormValid.value) {
    return
  }
  
  // Format data for submission
  let submitData: any = {}
  Object.keys(accountForm).forEach(key => {
    submitData[key] = accountForm[key as keyof typeof accountForm].value
    if(typeof submitData[key] === 'string') submitData[key] = submitData[key].trim()
  })
  
  // Convert roles to array format expected by backend
  submitData.roles = selectedRoles.value.map(role => parseInt(role))
  delete submitData.roles.value
  delete submitData.roles.touched
  delete submitData.roles.validationErrors
  delete submitData.roles.required
  
  // Add dealerships
  submitData.dealerships = selectedDealerships.value

  // Add dealer group if selected and user has permission
  if (canSetDealerGroup.value && selectedDealerGroup.value) {
    submitData.dealer_group_id = selectedDealerGroup.value
  }else{
    submitData.dealer_group_id = authStore.user?.dealerGroupId
  }

  emit('save', submitData)
}

// Load data when component mounts
onMounted(async () => {
  // Initialize dealer groups if user has permission
  if (canSetDealerGroup.value) {
    await managementStore.initializeDealerGroups()
  }

  // Initialize selected roles if editing
  if (props.isEditing && props.account) {
    // Initialize username

    Object.keys(accountForm).forEach(key => {accountForm[key as keyof typeof accountForm].value = props.account[key]})

    if (props.account.username) {
      accountForm.username.value = props.account.username
    }
    
    // Initialize contact information from the contact object
    if (props.account.contact) {
      accountForm.first_name.value = props.account.contact.first_name || ''
      accountForm.last_name.value = props.account.contact.last_name || ''
      accountForm.nickname.value = props.account.contact.nickname || ''
      accountForm.primary_email.value = props.account.contact.primary_email || ''
      accountForm.secondary_email.value = props.account.contact.secondary_email || ''
      accountForm.primary_phone_number.value = props.account.contact.primary_phone_number || ''
      accountForm.secondary_phone_number.value = props.account.contact.secondary_phone_number || ''
      accountForm.address_1.value = props.account.contact.address_1 || ''
      accountForm.address_2.value = props.account.contact.address_2 || ''
      accountForm.city.value = props.account.contact.city || ''
      accountForm.province.value = props.account.contact.province || ''
      accountForm.postal_code.value = props.account.contact.postal_code || ''
      
      // Handle birthday date formatting
      if (props.account.contact.birthday) {
        const birthday = new Date(props.account.contact.birthday)
        accountForm.birthday.value = birthday.toISOString().split('T')[0] || ''
      }
    }
    
    // Handle both single role (string) and multiple roles (array) formats
    if (Array.isArray(props.account.roles)) {
      selectedRoles.value = props.account.roles.map((role: any) => role.toString())
    } else if (props.account.role) {
      selectedRoles.value = [props.account.role.toString()]
    }
    
    // Initialize selected dealerships - handle both old and new format
    if (props.account.dealerships) {
      if (Array.isArray(props.account.dealerships)) {
        // New format: array of dealership objects
        if (props.account.dealerships.length > 0 && typeof props.account.dealerships[0] === 'object') {
          selectedDealerships.value = props.account.dealerships.map((d: any) => d.id.toString())
        } else {
          // Old format: array of dealership IDs
          selectedDealerships.value = props.account.dealerships
        }
      } else {
        // Single dealership
        selectedDealerships.value = [props.account.dealerships]
      }
    }

    // Initialize selected dealer group
    if (props.account.dealer_group_id) {
      selectedDealerGroup.value = props.account.dealer_group_id.toString()
    }
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

.dealership-checkboxes, .role-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem 0;
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: #ffa242;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
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
