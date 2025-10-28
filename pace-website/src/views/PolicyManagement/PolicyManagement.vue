<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { User, MapPin, Car, Save, Edit, X, DollarSign, Calendar, Building } from 'lucide-vue-next'
import { useManagementStore } from '../../stores/management'
import policyService from '../../services/policy.service'
import PolicyManagementModal from './policyManagementModal.vue'

const icons = { User, MapPin, Car, Save, Edit, X, DollarSign, Calendar, Building }
void icons


const managementStore = useManagementStore()
const isEditing = ref(false)
const selectedPolicyId = ref('')
const loading = ref(false)
const error = ref('')
const showEditModal = ref(false)
const selectedPolicy = ref<any>(null)
const searchQuery = ref('')
const filteredPolicies = ref<any[]>([])

const policyData = reactive({
  // Editable applicant fields
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postalCode: '',
  province: '',
  
  // Read-only policy information
  policyId: '',
  creationDate: '',
  sellerName: '',
  policyStatus: '',
  total_price: '',
  paymentMethod: '',
  
  // Vehicle information (read-only)
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vin: '',
  odometer: '',
  msrp: '',
  vehicleState: '',
  vehiclePurchaseYear: '',
  series: '',
  body: ''
})

// Fetch policies from API
const fetchPolicies = async (hardRefresh = false) => {
  loading.value = true
  error.value = ''
  try {
    if (hardRefresh) {
      await managementStore.refreshPolicies()
    } else {
      await managementStore.initializePolicies()
    }
  } catch (err: any) {
    console.error('Error fetching policies:', err)
    error.value = err.response?.data?.error || 'Failed to fetch policies'
  } finally {
    loading.value = false
  }
}

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

const saveChanges = async () => {
  try {
    loading.value = true
    
    // Prepare update data with only editable fields
    const updateData = {
      applicant: {
        first_name_1: policyData.firstName,
        last_name_1: policyData.lastName,
        email_1: policyData.email,
        phone_number_1: policyData.phone,
        postal_code: policyData.postalCode,
        province: policyData.province
      }
    }
    
    // Update the policy via API
    await policyService.updatePolicy(selectedPolicyId.value, updateData)
    
    // Refresh the policy data to get updated information
    await loadPolicyData(selectedPolicyId.value)
    
    isEditing.value = false
    alert('Policy information updated successfully!')
  } catch (err: any) {
    console.error('Error updating policy:', err)
    alert('Failed to update policy: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  // Reset form data if needed
  loadPolicyData(selectedPolicyId.value)
}

const loadPolicyData = async (policyId: string) => {
  try {
    loading.value = true
    // Fetch detailed policy information from API
    const policy = await policyService.getPolicy(policyId)
    
    if (policy) {
      selectedPolicyId.value = policyId
      
      // Map policy data to our reactive object
      Object.assign(policyData, {
        // Editable applicant fields
        firstName: policy.applicants?.first_name_1 || '',
        lastName: policy.applicants?.last_name_1 || '',
        email: policy.applicants?.email_1 || '',
        phone: policy.applicants?.phone_number_1 || '',
        postalCode: policy.applicants?.postal_code || '',
        province: policy.applicants?.province || '',
        
        // Read-only policy information
        policyId: policy.id,
        creationDate: new Date(policy.created_at).toLocaleDateString(),
        sellerName: policy.seller_id || 'N/A', // You might want to fetch seller name
        policyStatus: getPolicyStatusText(policy.policy_status),
        total_price: policy.total_price,
        paymentMethod: getPaymentMethodText(policy.policy_payment_method),
        
        // Vehicle information (read-only)
        vehicleYear: policy.vehicle_details?.model_year || '',
        vehicleMake: policy.vehicle_details?.make || '',
        vehicleModel: policy.vehicle_details?.model || '',
        vin: policy.vehicle_details?.vin || '',
        odometer: policy.vehicle_details?.odometer || '',
        msrp: policy.vehicle_details?.bought_vehicle_value || '',
        vehicleState: policy.vehicle_details?.vehicle_state || '',
        vehiclePurchaseYear: policy.vehicle_details?.vehicle_purchase_year || '',
        series: policy.vehicle_details?.series || '',
        body: policy.vehicle_details?.body || ''
      })
    }
  } catch (err: any) {
    console.error('Error loading policy data:', err)
    error.value = 'Failed to load policy details'
  } finally {
    loading.value = false
  }
}

// Helper function to convert policy status number to text
const getPolicyStatusText = (status: number) => {
  switch (status) {
    case 0: return 'New Pending'
    case 1: return 'Active'
    case 2: return 'Expired'
    case 3: return 'Cancel Pending'
    case 4: return 'Canceled'
    case 5: return 'Transferred'
    case 6: return 'Reinstated'
    case 7: return 'Void'
    case 8: return 'Lapsed'
    case 9: return 'Claim Pending'
    case 10: return 'Future'
    default: return 'Unknown'
  }
}

// Helper function to get status chip class
const getStatusChipClass = (status: number) => {
  switch (status) {
    case 0: return 'status-new-pending'
    case 1: return 'status-active'
    case 2: return 'status-expired'
    case 3: return 'status-cancel-pending'
    case 4: return 'status-canceled'
    case 5: return 'status-transferred'
    case 6: return 'status-reinstated'
    case 7: return 'status-void'
    case 8: return 'status-lapsed'
    case 9: return 'status-claim-pending'
    case 10: return 'status-future'
    default: return 'status-unknown'
  }
}

// Helper function to convert payment method number to text
const getPaymentMethodText = (method: number) => {
  switch (method) {
    case 1: return 'Vehicle Financing'
    case 2: return 'Cash'
    case 3: return 'Credit Card'
    case 4: return 'Bank Transfer'
    default: return 'Unknown'
  }
}

const openEditModal = (policy: any) => {
  selectedPolicy.value = policy
  console.log("policy received:", policy)
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedPolicy.value = null
}

const handlePolicyUpdate = async (updatedData: any) => {
  if (!selectedPolicy.value) return
  
  try {
    loading.value = true
    await policyService.updatePolicy(selectedPolicy.value.id, updatedData)
    
    // Refresh policies
    await fetchPolicies(true)
    
    // Close modal
    closeEditModal()
    
    alert('Policy updated successfully!')
  } catch (err: any) {
    console.error('Error updating policy:', err)
    alert('Failed to update policy: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

// Format policy data for display TODO this is so inefficent and needs to be improved
const formatPolicyData = (policy: any) => {
  console.log('formatPolicyData policy:', policy)
  return {
    id: policy.id,
    number: `${policy.id?.toString().padStart(6, '0')}`,
    holder: (policy.applicants?.first_name_1 || '') + ' ' + (policy.applicants?.last_name_1 || '') || 'Unknown Customer',
    vehicle: (policy.vehicle_details?.model_year || '') + ' ' + (policy.vehicle_details?.make || '') + ' ' + (policy.vehicle_details?.model || '') || 'Vehicle Info Unavailable',
    term: policy.policy_term,
    price: policy.total_price,
    productType: policy.products,
    dealership: policy.dealerships?.name || 'Unknown Dealership',
    vin: policy.vehicle_details?.vin || 'Unknown VIN'
  }
}

// Search and filter policies
const filterPolicies = () => {
  if (!searchQuery.value.trim()) {
    filteredPolicies.value = managementStore.policies
    return
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  filteredPolicies.value = managementStore.policies.filter(policy => {
    // Search in policy number
    const policyNumber = policy.id?.toString().padStart(6, '0') || ''
    if (policyNumber.includes(query)) return true
    
    // Search in applicant names
    const firstName1 = policy.applicants?.first_name_1?.toLowerCase() || ''
    const lastName1 = policy.applicants?.last_name_1?.toLowerCase() || ''
    const firstName2 = policy.applicants?.first_name_2?.toLowerCase() || ''
    const lastName2 = policy.applicants?.last_name_2?.toLowerCase() || ''
    const fullName1 = `${firstName1} ${lastName1}`.trim()
    const fullName2 = `${firstName2} ${lastName2}`.trim()
    
    if (firstName1.includes(query) || lastName1.includes(query) || 
        firstName2.includes(query) || lastName2.includes(query) ||
        fullName1.includes(query) || fullName2.includes(query)) return true
    
    // Search in customer number
    const customerNumber = policy.applicants?.customer_number?.toString() || ''
    if (customerNumber.includes(query)) return true
    
    // Search in dealership name
    const dealershipName = policy.dealerships?.name?.toLowerCase() || ''
    const dealershipNickname = policy.dealerships?.nickname?.toLowerCase() || ''
    if (dealershipName.includes(query) || dealershipNickname.includes(query)) return true
    
    // Search in dealer group (if available)
    const dealerGroup = policy.dealer_groups?.full_name?.toLowerCase() || ''
    const dealerGroupNickname = policy.dealer_groups?.nickname?.toLowerCase() || ''
    if (dealerGroup.includes(query) || dealerGroupNickname.includes(query)) return true
    
    // Search in vehicle details
    const vin = policy.vehicle_details?.vin?.toLowerCase() || ''
    const make = policy.vehicle_details?.make?.toLowerCase() || ''
    const model = policy.vehicle_details?.model?.toLowerCase() || ''
    const series = policy.vehicle_details?.series?.toLowerCase() || ''
    const vehicleYear = policy.vehicle_details?.model_year?.toString() || ''
    
    if (vin.includes(query) || make.includes(query) || model.includes(query) || 
        series.includes(query) || vehicleYear.includes(query)) return true
    
    // Search in seller information
    const sellerFirstName = policy.seller?.contacts_accounts_contact_idTocontacts?.first_name?.toLowerCase() || ''
    const sellerLastName = policy.seller?.contacts_accounts_contact_idTocontacts?.last_name?.toLowerCase() || ''
    const sellerUsername = policy.seller?.username?.toLowerCase() || ''
    const sellerFullName = `${sellerFirstName} ${sellerLastName}`.trim()
    
    if (sellerFirstName.includes(query) || sellerLastName.includes(query) || 
        sellerUsername.includes(query) || sellerFullName.includes(query)) return true
    
    return false
  })
}

// Watch for search query changes
watch(searchQuery, () => {
  filterPolicies()
})

// Watch for policies changes and update filtered list
watch(() => managementStore.policies, () => {
  filterPolicies()
}, { deep: true })

onMounted(() => {
  fetchPolicies()
})
</script>

<template>
  <div class="policy-management">
    <div class="page-header">
      <h1 class="page-title">Policy Management</h1>
      <p class="page-description">
        Manage and update policy information for your customers
      </p>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, customer number, policy number, dealership, dealer group, seller name, or vehicle details..."
            class="search-input"
          />
          <div class="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
        </div>
        <div v-if="searchQuery" class="search-results-info">
          {{ filteredPolicies.length }} of {{ managementStore.policies.length }} policies
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading policies...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchPolicies(true)" class="btn btn-primary">Retry</button>
    </div>

    <!-- Policy Selection -->
    <div v-else class="policy-selector">
      <div class="selector-header">
        <h2 class="selector-title">Select Policy</h2>
        <button @click="fetchPolicies(true)" class="refresh-button">
          Refresh
        </button>
      </div>
      
      <div v-if="filteredPolicies.length === 0" class="no-policies">
        <p v-if="searchQuery">No policies found matching "{{ searchQuery }}". Try a different search term.</p>
        <p v-else>No policies found. Create a new policy to get started.</p>
      </div>
      
      <div v-else class="policy-grid">
        <div
          v-for="policy in filteredPolicies"
          :key="policy.id"
          class="policy-card"
          :class="{ 'policy-selected': selectedPolicyId === policy.id }"
          @click="loadPolicyData(policy.id)"
        >
          <div class="policy-info">
            <div class="policy-header">
              <div class="policy-number">{{ policy.id?.toString().padStart(6, '0') }}</div>
              <div class="status-chip" :class="getStatusChipClass(policy.policy_status)">
                {{ getPolicyStatusText(policy.policy_status) }}
              </div>
            </div>
            <div class="policy-holder">{{ policy.applicants?.first_name_1 || '' }} {{ policy.applicants?.last_name_1 || '' }}</div>
            <div class="policy-vehicle">{{ policy.vehicle_details?.model_year || '' }} {{ policy.vehicle_details?.make || '' }} {{ policy.vehicle_details?.model || '' }}</div>
            <div class="policy-details">
              <span class="policy-term">
                <Calendar class="detail-icon" />
                {{ policy.policy_term }} months
              </span>
              <span class="policy-price">
                <DollarSign class="detail-icon" />
                ${{ policy.total_price }}
              </span>
              <span class="policy-dealership">
                <Building class="detail-icon" />
                {{ policy.dealerships?.nickname || policy.dealerships?.name || 'Unknown Dealership' }}
              </span>
            </div>
          </div>
          <div class="policy-actions">
            <button 
              @click.stop="openEditModal(policy)" 
              class="edit-button"
              title="Edit Policy"
            >
              <Edit class="edit-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Policy Information Form -->
    <div v-if="selectedPolicyId" class="policy-form">
      <div class="form-header">
        <h2 class="form-title">Policy Details - {{ policyData.policyId }}</h2>
        <div class="form-actions">
          <button
            v-if="!isEditing"
            @click="toggleEdit"
            class="btn btn-primary"
          >
            <Edit class="btn-icon" />
            Edit Information
          </button>
          <div v-else class="edit-actions">
            <button @click="saveChanges" class="btn btn-success" :disabled="loading">
              <Save class="btn-icon" />
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <button @click="cancelEdit" class="btn btn-secondary">
              <X class="btn-icon" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div class="form-content">
        <!-- Policy Information Section (Read-only) -->
        <div class="info-section">
          <div class="section-header">
            <Building class="section-icon" />
            <h3 class="section-title">Policy Information</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Policy ID</label>
              <div class="form-display">{{ policyData.policyId }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Creation Date</label>
              <div class="form-display">{{ policyData.creationDate }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Seller</label>
              <div class="form-display">{{ policyData.sellerName }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Policy Status</label>
              <div class="form-display">
                <div class="status-chip" :class="getStatusChipClass(selectedPolicy?.policy_status)">
                  {{ getPolicyStatusText(selectedPolicy?.policy_status) }}
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Policy Price</label>
              <div class="form-display price-display">{{ policyData.total_price }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <div class="form-display">{{ policyData.paymentMethod }}</div>
            </div>
          </div>
        </div>

        <!-- Vehicle Information Section (Read-only) -->
        <div class="info-section">
          <div class="section-header">
            <Car class="section-icon" />
            <h3 class="section-title">Vehicle Information</h3>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">VIN</label>
              <div class="form-display">{{ policyData.vin }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Make</label>
              <div class="form-display">{{ policyData.vehicleMake }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Model</label>
              <div class="form-display">{{ policyData.vehicleModel }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Series</label>
              <div class="form-display">{{ policyData.series }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Body Type</label>
              <div class="form-display">{{ policyData.body }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Model Year</label>
              <div class="form-display">{{ policyData.vehicleYear }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Purchase Year</label>
              <div class="form-display">{{ policyData.vehiclePurchaseYear }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Odometer</label>
              <div class="form-display">{{ policyData.odometer }} km</div>
            </div>
            <div class="form-group">
              <label class="form-label">MSRP</label>
              <div class="form-display">${{ policyData.msrp }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle State</label>
              <div class="form-display">{{ policyData.vehicleState }}</div>
            </div>
          </div>
        </div>

        <!-- Applicant Information Section (Editable) -->
        <div class="info-section">
          <div class="section-header">
            <User class="section-icon" />
            <h3 class="section-title">Applicant Information</h3>
            <span class="edit-indicator" v-if="isEditing">(Editable)</span>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="firstName" class="form-label">First Name</label>
              <input
                id="firstName"
                v-model="policyData.firstName"
                type="text"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
            <div class="form-group">
              <label for="lastName" class="form-label">Last Name</label>
              <input
                id="lastName"
                v-model="policyData.lastName"
                type="text"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                v-model="policyData.email"
                type="email"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
            <div class="form-group">
              <label for="phone" class="form-label">Phone Number</label>
              <input
                id="phone"
                v-model="policyData.phone"
                type="tel"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
            <div class="form-group">
              <label for="postalCode" class="form-label">Postal Code</label>
              <input
                id="postalCode"
                v-model="policyData.postalCode"
                type="text"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
            <div class="form-group">
              <label for="province" class="form-label">Province</label>
              <input
                id="province"
                v-model="policyData.province"
                type="text"
                class="form-input"
                :disabled="!isEditing"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Policy Edit Modal -->
    <PolicyManagementModal
      v-if="showEditModal"
      :policy="selectedPolicy"
      @close="closeEditModal"
      @save="handlePolicyUpdate"
    />
  </div>
</template>

<style scoped>
.policy-management {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

/* Search Section */
.search-section {
  margin-bottom: 2rem;
}

.search-container {
  max-width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #2A525A;
  box-shadow: 0 0 0 3px rgba(42, 82, 90, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  pointer-events: none;
}

.search-results-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #ffa242;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.policy-selector {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.selector-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.refresh-button {
  padding: 0.5rem 1rem;
  background: #ffa242;
  color: #2A525A;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background: #e6d700;
}

.no-policies {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.policy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.policy-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.policy-card:hover {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.05);
}

.policy-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.policy-info {
  flex: 1;
}

.policy-number {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.policy-holder {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.policy-vehicle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.policy-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.policy-term,
.policy-price,
.policy-dealership {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.select-button {
  padding: 0.5rem 1rem;
  background: #2A525A;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-button:hover {
  background: #1e3a40;
}

.edit-button {
  padding: 0.5rem;
  background: #ffa242;
  color: #2A525A;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 0.5rem;
}

.edit-button:hover {
  background: #e6d700;
}

.edit-icon {
  width: 1rem;
  height: 1rem;
}

.policy-form {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.form-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffa242;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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

.form-label {
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

.form-input:disabled,
.form-select:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-display {
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 500;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}

.status-chip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.status-new-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-active {
  background-color: #d1fae5;
  color: #065f46;
}

.status-expired {
  background-color: #f3f4f6;
  color: #374151;
}

.status-cancel-pending {
  background-color: #fde68a;
  color: #b45309;
}

.status-canceled {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-transferred {
  background-color: #e0e7ff;
  color: #3730a3;
}

.status-reinstated {
  background-color: #dcfce7;
  color: #166534;
}

.status-void {
  background-color: #f3f4f6;
  color: #6b7280;
}

.status-lapsed {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-claim-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-future {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-unknown {
  background-color: #f3f4f6;
  color: #6b7280;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.price-display {
  font-weight: 700;
  color: #059669;
  font-size: 1.125rem;
}

.edit-indicator {
  color: #ffa242;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.5rem;
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

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

@media (max-width: 768px) {
  .form-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .policy-grid {
    grid-template-columns: 1fr;
  }
  
  .policy-card {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .selector-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>