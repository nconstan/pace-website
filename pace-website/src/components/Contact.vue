<!--
  Contact Component Usage Example:
  
  <template>
    <Contact 
      @contact-created="handleContactCreated"
      @contact-selected="handleContactSelected"
    />
  </template>
  
  <script setup>
  import Contact from '../components/Contact.vue'
  
  const handleContactCreated = (contact) => {
    console.log('New contact created:', contact)
    // Handle the newly created contact
  }
  
  const handleContactSelected = (contact) => {
    console.log('Contact selected:', contact)
    // Handle the selected contact
  }
  </script>
-->

<template>
  <div class="contact-component">
    <div class="contact-buttons">
      <button @click="openSelectContactModal" class="btn btn-secondary">
        <Users class="btn-icon" />
        Add Organization Contacts
      </button>
      <button @click="openCreateContactModal" class="btn btn-primary">
        <UserPlus class="btn-icon" />
        Create New Contact Information
      </button>
    </div>

    <!-- Create New Contact Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Contact</h3>
          <button @click="closeCreateModal" class="close-btn">
            <X class="close-icon" />
          </button>
        </div>
        
        <form @submit.prevent="handleCreateContact" class="contact-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input
                id="firstName"
                v-model="contactForm.firstName"
                type="text"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input
                id="lastName"
                v-model="contactForm.lastName"
                type="text"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="nickname">Nickname</label>
              <input
                id="nickname"
                v-model="contactForm.nickname"
                type="text"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="primaryEmail">Primary Email *</label>
              <input
                id="primaryEmail"
                v-model="contactForm.primaryEmail"
                type="email"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="secondaryEmail">Secondary Email</label>
              <input
                id="secondaryEmail"
                v-model="contactForm.secondaryEmail"
                type="email"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="primaryPhone">Primary Phone Number *</label>
              <input
                id="primaryPhone"
                v-model="contactForm.primaryPhone"
                type="tel"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="secondaryPhone">Secondary Phone Number</label>
              <input
                id="secondaryPhone"
                v-model="contactForm.secondaryPhone"
                type="tel"
                class="form-input"
              />
            </div>
            
            <div class="form-group full-width">
              <label for="address1">Address 1 *</label>
              <input
                id="address1"
                v-model="contactForm.address1"
                type="text"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group full-width">
              <label for="address2">Address 2</label>
              <input
                id="address2"
                v-model="contactForm.address2"
                type="text"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="city">City *</label>
              <input
                id="city"
                v-model="contactForm.city"
                type="text"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="province">Province *</label>
              <select
                id="province"
                v-model="contactForm.province"
                required
                class="form-select"
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
            </div>
            
            <div class="form-group">
              <label for="postalCode">Postal Code *</label>
              <input
                id="postalCode"
                v-model="contactForm.postalCode"
                type="text"
                required
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="birthday">Birthday</label>
              <div class="birthday-inputs">
                <select v-model="contactForm.birthMonth" class="form-select">
                  <option value="">Month</option>
                  <option v-for="month in 12" :key="month" :value="month">
                    {{ getMonthName(month) }}
                  </option>
                </select>
                <select v-model="contactForm.birthDay" class="form-select">
                  <option value="">Day</option>
                  <option v-for="day in 31" :key="day" :value="day">
                    {{ day }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeCreateModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Contact' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Select Organization Contact Modal -->
    <div v-if="showSelectModal" class="modal-overlay" @click="closeSelectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Select Organization Contact</h3>
          <button @click="closeSelectModal" class="close-btn">
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="search-section">
          <div class="search-input-group">
            <Search class="search-icon" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Search by name or email..."
              class="search-input"
              @input="handleSearch"
              @focus="showDropdown = true"
            />
          </div>
          
          <!-- Search Results Dropdown -->
          <div v-if="showDropdown && searchResults.length > 0" class="search-results">
            <div
              v-for="contact in searchResults"
              :key="contact.id"
              class="search-result-item"
              @click="selectContact(contact)"
            >
              <div class="contact-name">{{ contact.first_name }} {{ contact.last_name }}</div>
              <div class="contact-email">{{ contact.primary_email }}</div>
            </div>
          </div>
          
          <div v-else-if="showDropdown && searchTerm && !isSearching" class="no-results">
            No contacts found
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeSelectModal" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Users, UserPlus, X, Search } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import adminService from '../services/admin.service'

interface Contact {
  id: string
  first_name: string
  last_name: string
  primary_email: string
  primary_phone_number: string
}

interface ContactForm {
  firstName: string
  lastName: string
  nickname: string
  primaryEmail: string
  secondaryEmail: string
  primaryPhone: string
  secondaryPhone: string
  address1: string
  address2: string
  city: string
  province: string
  postalCode: string
  birthMonth: number | null
  birthDay: number | null
}

const emit = defineEmits<{
  contactCreated: [contact: Contact]
  contactSelected: [contact: Contact]
}>()

const { user } = useAuth()

// Modal states
const showCreateModal = ref(false)
const showSelectModal = ref(false)
const showDropdown = ref(false)
const isSubmitting = ref(false)
const isSearching = ref(false)

// Search
const searchTerm = ref('')
const searchResults = ref<Contact[]>([])

// Form data
const contactForm = reactive<ContactForm>({
  firstName: '',
  lastName: '',
  nickname: '',
  primaryEmail: '',
  secondaryEmail: '',
  primaryPhone: '',
  secondaryPhone: '',
  address1: '',
  address2: '',
  city: '',
  province: '',
  postalCode: '',
  birthMonth: null,
  birthDay: null
})

// Modal functions
const openCreateContactModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
}

const openSelectContactModal = () => {
  showSelectModal.value = true
}

const closeSelectModal = () => {
  showSelectModal.value = false
  searchTerm.value = ''
  searchResults.value = []
  showDropdown.value = false
}

// Form functions
const resetForm = () => {
  Object.assign(contactForm, {
    firstName: '',
    lastName: '',
    nickname: '',
    primaryEmail: '',
    secondaryEmail: '',
    primaryPhone: '',
    secondaryPhone: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    birthMonth: null,
    birthDay: null
  })
}

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1]
}

const handleCreateContact = async () => {
  isSubmitting.value = true
  
  try {
    // Create birthday date if both month and day are provided
    let birthday = undefined
    if (contactForm.birthMonth && contactForm.birthDay) {
      const currentYear = new Date().getFullYear()
      birthday = new Date(currentYear, contactForm.birthMonth - 1, contactForm.birthDay)
    }
    
    const contactData = {
      first_name: contactForm.firstName,
      last_name: contactForm.lastName,
      nickname: contactForm.nickname || undefined,
      primary_email: contactForm.primaryEmail,
      secondary_email: contactForm.secondaryEmail || undefined,
      primary_phone_number: contactForm.primaryPhone,
      secondary_phone_number: contactForm.secondaryPhone || undefined,
      address_1: contactForm.address1,
      address_2: contactForm.address2 || undefined,
      city: contactForm.city,
      province: contactForm.province,
      postal_code: contactForm.postalCode,
      birthday: birthday
    }
    
    const newContact = await adminService.createContact(contactData)
    emit('contactCreated', newContact)
    closeCreateModal()
  } catch (error) {
    console.error('Error creating contact:', error)
    // Handle error (show notification, etc.)
  } finally {
    isSubmitting.value = false
  }
}

// Search functions
const handleSearch = async () => {
  if (!searchTerm.value.trim()) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  try {
    const results = await adminService.searchContacts(searchTerm.value, user.value?.dealerGroupId)
    searchResults.value = results.slice(0, 5) // Limit to 5 results
  } catch (error) {
    console.error('Error searching contacts:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const selectContact = (contact: Contact) => {
  emit('contactSelected', contact)
  closeSelectModal()
}

// Close dropdown when clicking outside
const handleClickOutside = () => {
  if (showDropdown.value) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.contact-component {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
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
  z-index: 1000;
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

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

/* Form Styles */
.contact-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2A525A;
}

.birthday-inputs {
  display: flex;
  gap: 0.5rem;
}

.birthday-inputs .form-select {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Search Styles */
.search-section {
  padding: 1.5rem;
  position: relative;
}

.search-input-group {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2A525A;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #f9fafb;
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

.no-results {
  padding: 0.75rem 1rem;
  color: #6b7280;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .contact-buttons {
    flex-direction: column;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .birthday-inputs {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
