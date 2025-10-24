<template>
  <div class="contact-section">
    <div class="section-header">
      <div class="contact-buttons">
        <button type="button" @click="openSelectContactModal" v-if="showAddOrganizationContacts" class="btn btn-secondary">
          <Users class="btn-icon" />
          Add Organization Contacts
        </button>
        <button type="button" @click="openCreateContactModal" class="btn btn-primary">
          <UserPlus class="btn-icon" />
          Create New Contact
        </button>
      </div>
    </div>

    <!-- Primary Contact Display -->
    <div v-if="primaryContact" class="primary-contact">
      <h5 class="contact-subtitle">Primary Contact</h5>
      <div class="contact-card primary">
        <div class="contact-info">
          <div class="contact-name">{{ props.contacts.primary.value.first_name }} {{ props.contacts.primary.value.last_name }}</div>
          <div class="contact-email">{{ props.contacts.primary.value.primary_email }}</div>
        </div>
        <button 
          type="button"
          @click="removePrimaryContact" 
          class="remove-contact-btn"
          title="Remove primary contact"
        >
          <X class="remove-icon" />
        </button>
      </div>
    </div>

    <!-- Secondary Contacts List -->
    <div v-if="props.contacts.secondary.value.length > 0" class="secondary-contacts">
      <h5 class="contact-subtitle">Secondary Contacts</h5>
      <div class="contacts-list">
        <div 
          v-for="contact in secondaryContacts" 
          :key="contact.id"
          class="contact-card secondary"
        >
          <div class="contact-info">
            <div class="contact-name">{{ contact.first_name }} {{ contact.last_name }}</div>
            <div class="contact-email">{{ contact.primary_email }}</div>
          </div>
          <button 
            type="button"
            @click="removeSecondaryContact(contact.id)" 
            class="remove-contact-btn"
            title="Remove contact"
          >
            <X class="remove-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- No Contacts Message -->
    <div v-if="!primaryContact && secondaryContacts.length === 0" class="no-contacts">
      <Users class="no-contacts-icon" />
      <p>No contacts assigned to this {{ entityType }}</p>
      <p class="no-contacts-hint">Use the buttons above to add contacts</p>
    </div>

    <!-- Create New Contact Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Create New Contact</h3>
          <button type="button" @click="closeCreateModal" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        
        <form @submit.prevent="handleCreateContact" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName" class="form-label">First Name *</label>
              <input
                id="firstName"
                v-model="contactForm.first_name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('first_name') }"
                placeholder="Enter first name"
                @blur="markFieldAsTouched('first_name')"
              />
              <div v-if="shouldShowError('first_name')" class="error-message">{{ contactForm.first_name.validationErrors }}</div>
            </div>
            <div class="form-group">
              <label for="lastName" class="form-label">Last Name *</label>
              <input
                id="lastName"
                v-model="contactForm.last_name.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('last_name') }"
                placeholder="Enter last name"
                @blur="markFieldAsTouched('last_name')"
              />
              <div v-if="shouldShowError('last_name')" class="error-message">{{ contactForm.last_name.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="nickname" class="form-label">Nickname (Optional)</label>
            <input
              id="nickname"
              v-model="contactForm.nickname.value"
              type="text"
              class="form-input"
              placeholder="Enter nickname"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="primaryEmail" class="form-label">Primary Email *</label>
              <input
                id="primaryEmail"
                v-model="contactForm.primary_email.value"
                type="email"
                class="form-input"
                :class="{ 'error': shouldShowError('primary_email') }"
                placeholder="Enter primary email"
                @blur="markFieldAsTouched('primary_email')"
              />
              <div v-if="shouldShowError('primary_email')" class="error-message">{{ contactForm.primary_email.validationErrors }}</div>
            </div>
            <div class="form-group">
              <label for="secondaryEmail" class="form-label">Secondary Email (Optional)</label>
              <input
                id="secondaryEmail"
                v-model="contactForm.secondary_email.value"
                type="email"
                class="form-input"
                :class="{ 'error': shouldShowError('secondary_email') }"
                placeholder="Enter secondary email"
                @blur="markFieldAsTouched('secondary_email')"
              />
              <div v-if="shouldShowError('secondary_email')" class="error-message">{{ contactForm.secondary_email.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="primaryPhone" class="form-label">Primary Phone *</label>
              <input
                id="primaryPhone"
                v-model="contactForm.primary_phone_number.value"
                type="tel"
                class="form-input"
                :class="{ 'error': shouldShowError('primary_phone_number') }"
                placeholder="Enter primary phone"
                @blur="markFieldAsTouched('primary_phone_number')"
                @input="(event) => autoFormat(event, 'phone')"
              />
              <div v-if="shouldShowError('primary_phone_number')" class="error-message">{{ contactForm.primary_phone_number.validationErrors }}</div>
            </div>
            <div class="form-group">
              <label for="secondaryPhone" class="form-label">Secondary Phone (Optional)</label>
              <input
                id="secondaryPhone"
                v-model="contactForm.secondary_phone_number.value"
                type="tel"
                class="form-input"
                :class="{ 'error': shouldShowError('secondary_phone_number') }"
                placeholder="Enter secondary phone"
                @blur="markFieldAsTouched('secondary_phone_number')"
                @input="(event) => autoFormat(event, 'phone')"
              />
              <div v-if="shouldShowError('secondary_phone_number')" class="error-message">{{ contactForm.secondary_phone_number.validationErrors }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="address1" class="form-label">Address 1 *</label>
            <input
              id="address1"
              v-model="contactForm.address_1.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('address_1') }"
              placeholder="Enter address line 1"
              @blur="markFieldAsTouched('address_1')"
            />
            <div v-if="shouldShowError('address_1')" class="error-message">{{ contactForm.address_1.validationErrors }}</div>
          </div>
          
          <div class="form-group">
            <label for="address2" class="form-label">Address 2 (Optional)</label>
            <input
              id="address2"
              v-model="contactForm.address_2.value"
              type="text"
              class="form-input"
              placeholder="Enter address line 2"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="city" class="form-label">City *</label>
              <input
                id="city"
                v-model="contactForm.city.value"
                type="text"
                class="form-input"
                :class="{ 'error': shouldShowError('city') }"
                placeholder="Enter city"
                @blur="markFieldAsTouched('city')"
              />
              <div v-if="shouldShowError('city')" class="error-message">{{ contactForm.city.validationErrors }}</div>
            </div>
            <ProvinceSelect
              v-model="contactForm.province.value"
              :has-error="!!shouldShowError('province')"
              :error-message="contactForm.province.validationErrors"
              @blur="markFieldAsTouched('province')"
            />
          </div>
          
          <div class="form-group">
            <label for="postalCode" class="form-label">Postal Code *</label>
            <input
              id="postalCode"
              v-model="contactForm.postal_code.value"
              type="text"
              class="form-input"
              :class="{ 'error': shouldShowError('postal_code') }"
              placeholder="Enter postal code"
              @blur="markFieldAsTouched('postal_code')"
              @input="(event) => autoFormat(event, 'postalCode')"
            />
            <div v-if="shouldShowError('postal_code')" class="error-message">{{ contactForm.postal_code.validationErrors }}</div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <DatePicker
                v-model="contactForm.birthday.value"
                label="Birthday (Optional)"
                placeholder="Select birthday"
                :min-date="new Date(1900, 0, 1)"
                :max-date="new Date()"
                :has-error="!!shouldShowError('birthday')"
                :error-message="contactForm.birthday.validationErrors"
                @blur="markFieldAsTouched('birthday')"
              />
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-success" :class="{ 'disabled': !isFormValid }" :disabled="!isFormValid">
              <Save class="btn-icon" />
              Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Select Organization Contact Modal -->
    <div v-if="showSelectModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Select Organization Contact</h3>
          <button type="button" @click="closeSelectModal" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-form">
          <div class="form-group">
            <label for="searchTerm" class="form-label">Search by Name or Email</label>
            <input
              id="searchTerm"
              v-model="searchTerm"
              type="text"
              class="form-input"
              placeholder="Enter name or email to search"
              @input="handleSearch"
            />
          </div>
          
          <div v-if="showDropdown && searchResults.length > 0" class="search-results">
            <div 
              v-for="contact in searchResults" 
              :key="contact.id"
              @click="selectContact(contact)"
              class="search-result-item"
            >
              <div class="contact-name">{{ contact.first_name }} {{ contact.last_name }}</div>
              <div class="contact-email">{{ contact.primary_email }}</div>
            </div>
          </div>
          
          <div v-else-if="searchTerm && !showDropdown" class="no-results">
            <p>No contacts found matching "{{ searchTerm }}"</p>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeSelectModal" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ContactManagement'
}
</script>


<script setup lang="ts">
import { ref,  reactive, onMounted, onUnmounted, computed } from 'vue'
import { autoValidate } from '../../Mixins/Rules'
import { autoFormat } from '../../Mixins/Validation/formattingRules'
import { useAuth } from '../../composables/useAuth'
import adminService from '../../services/admin.service'
import ProvinceSelect from '../../components/molecules/ProvinceSelect.vue'
import DatePicker from '../../components/molecules/DatePicker.vue'
import { Users, X, Save, UserPlus } from 'lucide-vue-next'

// Reference imports to prevent build errors
const _ = { Users, X, Save, UserPlus }
void _

interface Contact {
  id: string
  first_name: string
  last_name: string
  primary_email: string
  primary_phone_number: string
  is_primary?: boolean
}

interface Props {
  entityType: string // 'dealer group' or 'dealership'
  showAddOrganizationContacts?: boolean
  contacts: {
    primary: any | undefined,
    secondary: any | undefined
  }
}

// interface Emits {
//   (e: 'contacts-changed', contacts: { primary: Contact | null, secondary: Contact[] }): void
// }

const props = defineProps<Props>()
//const emit = defineEmits<Emits>()
const { user } = useAuth()

// Contact management
const primaryContact = ref<Contact | null>(null)
const secondaryContacts = ref<Contact[]>([])

// Modal states
const showCreateModal = ref(false)
const showSelectModal = ref(false)
const showDropdown = ref(false)
const searchTerm = ref('')
const searchResults = ref<Contact[]>([])
const contactList = ref<Contact[]>([])

// Contact form
const contactForm = reactive({
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
  birthday: {value: '', touched: false, validationErrors: '', required: true}
})

const shouldShowError = (field: string) => {
  return contactForm[field as keyof typeof contactForm].touched && contactForm[field as keyof typeof contactForm].validationErrors
}

const markFieldAsTouched = (field: string) => {
  contactForm[field as keyof typeof contactForm].touched = true
  validateField(field)
}

const validateField = (field: string) => {
  const value = contactForm[field as keyof typeof contactForm].value
  console.log(field, value)
  if(contactForm[field as keyof typeof contactForm].required || value) {
    contactForm[field as keyof typeof contactForm].validationErrors = autoValidate(value, field).message
  }else{
    contactForm[field as keyof typeof contactForm].validationErrors = ''
  }
}

const validateForm = () => {
  // Check if all required fields have values  
  for (const field in contactForm) {
    if(contactForm[field as keyof typeof contactForm].required || contactForm[field as keyof typeof contactForm].value) {
      validateField(field)
      if(contactForm[field as keyof typeof contactForm].validationErrors) {
        return false
      }
    }
  }
  return true
}

const isFormValid = computed(() => {
  return validateForm()
})

// Watch for changes in contacts and emit updates
// watch([primaryContact, secondaryContacts], () => {
//   emit('contacts-changed', {
//     primary: primaryContact.value,
//     secondary: secondaryContacts.value
//   })
// }, { deep: true })

// Modal functions
const openCreateContactModal = () => {
  showCreateModal.value = true
  resetContactForm()
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetContactForm()
}

// Contact search
const handleSearch = async () => {
  if (searchTerm.value.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }
  // Search through local contact list
  const filteredResults = contactList.value.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    const email = contact.primary_email.toLowerCase()
    const searchLower = searchTerm.value.toLowerCase()
    
    return fullName.includes(searchLower) || email.includes(searchLower)
  })

  searchResults.value = filteredResults.slice(0, 5)
  showDropdown.value = true
}

// Load all contacts when modal opens
const loadAllContacts = async () => {
  try {
    const allContacts = await adminService.getContacts('', user.value?.dealerGroupId)
    contactList.value = allContacts
  } catch (error) {
    console.error('Error loading contacts:', error)
    contactList.value = []
  }
}

const openSelectContactModal = async () => {
  showSelectModal.value = true
  searchTerm.value = ''
  searchResults.value = []
  showDropdown.value = false
  
  // Load all contacts when modal opens
  if(contactList.value.length === 0) {
    await loadAllContacts()
  }
}

const closeSelectModal = () => {
  showSelectModal.value = false
  searchTerm.value = ''
  searchResults.value = []
  showDropdown.value = false
}

const resetContactForm = () => {
    Object.keys(contactForm).forEach(key => {
        contactForm[key as keyof typeof contactForm].value = ''
        contactForm[key as keyof typeof contactForm].touched = false
        contactForm[key as keyof typeof contactForm].validationErrors = ''
    })
}

// Contact creation
const handleCreateContact = async () => {
  // Mark all required fields as touched and validate them
  Object.keys(contactForm).forEach(key => {
    if(contactForm[key as keyof typeof contactForm].required){
      contactForm[key as keyof typeof contactForm].touched = true
      validateField(key)
    }
  })
  
  // Check if form is valid after validation
  if (!isFormValid.value) {
    return
  }
  handleContactCreated()
  closeCreateModal()
}

const selectContact = (contact: Contact) => {
  handleContactSelected(contact)
  closeSelectModal()
}

// Contact management functions
const handleContactCreated = () => {
  let contactObject: any = {}
  Object.keys(contactForm).forEach(key => {
    contactObject[key] = contactForm[key as keyof typeof contactForm].value
  })
  console.log("contactObject", props.contacts.primary)
  // If no primary contact exists, make this the primary
  if (props.contacts.primary.value === undefined) {
    props.contacts.primary.value = contactObject
    primaryContact.value = contactObject
  } else {
    // Otherwise add as secondary contact
    console.log(props.contacts)
    props.contacts.secondary.value.push(contactObject)
    secondaryContacts.value.push(contactObject)
  }
}

const handleContactSelected = (contact: Contact) => {
  // Check if contact is already assigned
  console.log("contact", contact)
  if (primaryContact.value?.id === contact.id || 
      secondaryContacts.value.some(c => c.id === contact.id)) {
    return // Contact already assigned
  }
  
  // If no primary contact exists, make this the primary
  if (props.contacts.primary.value === undefined) {
    props.contacts.primary.value = contact
    primaryContact.value = contact
  } else {
    // Otherwise add as secondary contact
    props.contacts.secondary.value.push(contact)
    secondaryContacts.value.push(contact)
  }
}

const removePrimaryContact = () => {
  primaryContact.value = null
}

const removeSecondaryContact = (contactId: string) => {
  secondaryContacts.value = secondaryContacts.value.filter(c => c.id !== contactId)
}

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-results') && !target.closest('input')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  if(props.contacts.primary){
    primaryContact.value = props.contacts.primary
  }
  if(props.contacts.secondary){
    secondaryContacts.value = props.contacts.secondary
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
/* Contact Section Styles */
.contact-section {
  padding-top: 0rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.section-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.contact-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.primary-contact {
  margin-bottom: 1.5rem;
}

.contact-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  transition: all 0.2s;
}

.contact-card.primary {
  border-color: #2A525A;
  background: #fefce8;
}

.contact-card.secondary {
  border-color: #e5e7eb;
  background: #f9fafb;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.contact-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.remove-contact-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  color: #ef4444;
}

.remove-contact-btn:hover {
  background: #fef2f2;
}

.remove-icon {
  width: 1rem;
  height: 1rem;
}

.contacts-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-contacts {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-contacts-icon {
  width: 3rem;
  height: 3rem;
  color: #d1d5db;
  margin: 0 auto 1rem;
}

.no-contacts-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Button styles for placeholder */
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

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-success.disabled,
.btn-success:disabled {
  background: #9ca3af !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
  pointer-events: none !important;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.contact-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Modal Styles */
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
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 600px;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
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

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

/* Search Results */
.search-results {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  background: white;
}

.search-result-item {
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background: #f9fafb;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item .contact-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.search-result-item .contact-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

/* V-Calendar specific styles */
.birthday-calendar {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.birthday-calendar:focus-within {
  border-color: #2A525A;
}

.birthday-calendar.error {
  border-color: #ef4444;
}

@media (max-width: 768px) {
  .contact-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .remove-contact-btn {
    align-self: flex-end;
  }
  
  .contact-buttons {
    flex-direction: column;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
