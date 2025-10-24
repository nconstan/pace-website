<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Find Existing Account</h2>
        <button @click="closeModal" class="close-button">
          <X class="close-icon" />
        </button>
      </div>

      <div class="modal-body">
        <div class="search-section">
          <div class="search-tabs">
            <button 
              @click="searchType = 'customerNumber'" 
              :class="['tab-button', { active: searchType === 'customerNumber' }]"
            >
              Search by Customer Number
            </button>
            <button 
              @click="searchType = 'email'" 
              :class="['tab-button', { active: searchType === 'email' }]"
            >
              Search by Email
            </button>
            <button 
              @click="searchType = 'policyId'" 
              :class="['tab-button', { active: searchType === 'policyId' }]"
            >
              Search by Policy ID
            </button>
          </div>

          <div class="search-input-section">
            <div v-if="searchType === 'customerNumber'" class="input-group">
              <label for="customer-number-search">Customer Number</label>
              <input
                id="customer-number-search"
                v-model="searchValue"
                type="text"
                placeholder="Enter customer number"
                class="search-input"
                @keyup.enter="searchPolicies"
              />
            </div>

            <div v-if="searchType === 'email'" class="input-group">
              <label for="email-search">Email Address</label>
              <input
                id="email-search"
                v-model="searchValue"
                type="email"
                placeholder="Enter email address"
                class="search-input"
                @keyup.enter="searchPolicies"
              />
            </div>

            <div v-if="searchType === 'policyId'" class="input-group">
              <label for="policy-id-search">Policy ID</label>
              <input
                id="policy-id-search"
                v-model="searchValue"
                type="text"
                placeholder="Enter policy ID"
                class="search-input"
                @keyup.enter="searchPolicies"
              />
            </div>

            <button 
              @click="searchPolicies" 
              class="search-button"
              :disabled="!searchValue.trim() || isLoading"
            >
              <Search v-if="!isLoading" class="search-icon" />
              <Loader2 v-else class="search-icon spinning" />
              {{ isLoading ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </div>

        <!-- Customer Information -->
        <div v-if="foundCustomer" class="customer-info-section">
          <h3>Customer Information</h3>
          <div class="customer-card">
            <div class="customer-details">
              <div class="customer-header">
                <h4>Customer #{{ foundCustomer.customer_number }}</h4>
                <button @click="useCustomer" class="use-customer-button">
                  <Check class="action-icon" />
                  Use This Customer
                </button>
              </div>
              <div class="customer-info">
                <p><strong>Name:</strong> {{ foundCustomer.first_name_1 }} {{ foundCustomer.last_name_1 }}</p>
                <p><strong>Email:</strong> {{ foundCustomer.email_1 }}</p>
                <p><strong>Phone:</strong> {{ foundCustomer.phone_number_1 }}</p>
                <p><strong>Address:</strong> {{ foundCustomer.address_1 }}, {{ foundCustomer.city }}, {{ foundCustomer.province }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-if="searchResults.length > 0" class="results-section">
          <h3>Found Policies</h3>
          <div class="policies-list">
            <div 
              v-for="policy in searchResults" 
              :key="policy.id"
              class="policy-item"
            >
              <div class="policy-info">
                <div class="policy-header">
                  <h4>Policy #{{ policy.id }}</h4>
                  <span :class="['status-badge', getStatusText(policy.policy_status || 0)]">
                    {{ getStatusText(policy.policy_status || 0) }}
                  </span>
                </div>
                
                <div class="policy-details">
                  <div class="detail-row">
                    <span class="detail-label">Vehicle:</span>
                    <span class="detail-value">{{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details?.make || policy.make }} {{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details?.model || policy.model }} {{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details?.series || policy.model_series }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">VIN:</span>
                    <span class="detail-value">{{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details?.vin || policy.VIN }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Premium:</span>
                    <span class="detail-value">${{ (policy.total_price || policy.policy_price || 0).toFixed(2) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Term:</span>
                    <span class="detail-value">{{ policy.policy_term || 'N/A' }} months</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ policy.created_at ? formatDate(policy.created_at) : 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <div class="policy-actions">
                <button 
                  v-if="policy.policy_status === 1"
                  @click="transferPolicy(policy.id)"
                  class="transfer-button"
                  :disabled="isTransferring === policy.id"
                >
                  <Calculator v-if="isTransferring !== policy.id" class="action-icon" />
                  <Loader2 v-else class="action-icon spinning" />
                  {{ isTransferring === policy.id ? 'Processing...' : 'Transfer Policy' }}
                </button>
                <span v-else class="inactive-policy">
                  Policy is not active for transfer
                </span>
              </div>

              <!-- Transfer Result -->
              <div v-if="transferResults[policy.id]" class="transfer-result">
                <div class="refund-amount">
                  <span class="refund-label">Refund Amount:</span>
                  <span class="refund-value">${{ transferResults[policy.id].refundAmount.toFixed(2) }}</span>
                </div>
                <p class="transfer-note">This policy will be transferred to your new policy</p>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else-if="hasSearched && !isLoading" class="no-results">
          <p>No policies found matching your search criteria.</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FindPolicyModal',
}
</script>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { X, Search, Calculator, Check, Loader2 } from 'lucide-vue-next'
import policyService from '../../services/policy.service'

interface Policy {
  id: string
  policy_status: number
  VIN?: string
  make?: string
  model?: string
  model_series?: string
  policy_price?: number
  policy_term?: string
  created_at?: string
  total_price?: number
  vehicle_details_policies_vehicle_detailsTovehicle_details?: any
  applicants?: any
}

interface RefundResult {
  refundAmount: number
  details: any
}

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'selectPolicy', policyId: string, refundAmount: number): void
  (e: 'useCustomer', customer: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use props to avoid unused variable warning
const isOpen = computed(() => props.isOpen)

const searchType = ref<'customerNumber' | 'email' | 'policyId'>('customerNumber')
const searchValue = ref('')
const searchResults = ref<Policy[]>([])
const refundResults = reactive<Record<string, RefundResult>>({})
const transferResults = reactive<Record<string, RefundResult>>({})
const foundCustomer = ref<any>(null)
const isLoading = ref(false)
const isCalculatingRefund = ref<string | null>(null)
const isTransferring = ref<string | null>(null)
const hasSearched = ref(false)
const errorMessage = ref('')

const closeModal = () => {
  emit('close')
  resetModal()
}

const resetModal = () => {
  searchValue.value = ''
  searchResults.value = []
  Object.keys(refundResults).forEach(key => delete refundResults[key])
  Object.keys(transferResults).forEach(key => delete transferResults[key])
  foundCustomer.value = null
  hasSearched.value = false
  errorMessage.value = ''
  isLoading.value = false
  isCalculatingRefund.value = null
  isTransferring.value = null
}

const searchPolicies = async () => {
  if (!searchValue.value.trim()) return

  isLoading.value = true
  errorMessage.value = ''
  hasSearched.value = true
  foundCustomer.value = null

  try {
    let policies: Policy[]
    
    if (searchType.value === 'customerNumber') {
      // Search by customer number using the dedicated endpoint
      const filters = {
        policy_status: 1 // Only confirmed policies
      }
      policies = await policyService.getPoliciesByCustomerNumber(searchValue.value, filters)
      console.log(policies)
      // If we found policies, get the customer info from the first policy
      if (policies.length > 0 && policies[0].applicants) {
        foundCustomer.value = policies[0].applicants
        // Automatically use the customer information
        useCustomer()
      }
    } else if (searchType.value === 'email') {
      // Search by email
      policies = await policyService.searchPoliciesByEmail(searchValue.value)
    } else {
      // Search by policy ID
      const policy = await policyService.getPolicy(searchValue.value)
      policies = policy ? [policy] : []
    }

    searchResults.value = policies
  } catch (error: any) {
    console.error('Error searching policies:', error)
    errorMessage.value = error.response?.data?.error || 'Failed to search policies'
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

// const calculateRefund = async (policyId: string) => {
//   isCalculatingRefund.value = policyId
//   errorMessage.value = ''

//   try {
//     const refund = await policyService.calculateRefund(policyId)
//     refundResults[policyId] = refund
//   } catch (error: any) {
//     console.error('Error calculating refund:', error)
//     errorMessage.value = `Failed to calculate refund for policy ${policyId}: ${error.response?.data?.error || error.message}`
//   } finally {
//     isCalculatingRefund.value = null
//   }
// }

// const selectPolicy = (policyId: string) => {
//   const refund = refundResults[policyId]
//   if (refund) {
//     emit('selectPolicy', policyId, refund.refundAmount)
//     closeModal()
//   }
// }

const useCustomer = () => {
  if (foundCustomer.value) {
    emit('useCustomer', foundCustomer.value)
  }
}

const transferPolicy = async (policyId: string) => {
  isTransferring.value = policyId
  errorMessage.value = ''

  try {
    const refund = await policyService.calculateRefund(policyId)
    transferResults[policyId] = refund
    emit('selectPolicy', policyId, refund.refundAmount)
  } catch (error: any) {
    console.error('Error transferring policy:', error)
    errorMessage.value = `Failed to transfer policy ${policyId}: ${error.response?.data?.error || error.message}`
  } finally {
    isTransferring.value = null
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Pending'
    case 1: return 'Confirmed'
    case 2: return 'Cancelled'
    default: return 'Unknown'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
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
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #2A525A;
  border-bottom-color: #ffa242;
}

.tab-button:hover:not(.active) {
  color: #374151;
}

.search-input-section {
  display: flex;
  gap: 1rem;
  align-items: end;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2A525A;
}

.search-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ffa242;
  color: #2A525A;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  background: #e6d700;
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.results-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.policies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.policy-item {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.policy-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-confirmed {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-unknown {
  background: #f3f4f6;
  color: #374151;
}

.policy-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.policy-actions {
  margin-bottom: 1rem;
}

.refund-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refund-button:hover:not(:disabled) {
  background: #059669;
}

.refund-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.refund-result {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}

.refund-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.refund-label {
  font-weight: 500;
  color: #374151;
}

.refund-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.select-policy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2A525A;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  justify-content: center;
}

.select-policy-button:hover {
  background: #1f3d42;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.error-message p {
  margin: 0;
  font-weight: 500;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .search-input-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-button {
    justify-content: center;
  }

  .policy-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* Customer Info Section */
.customer-info-section {
  margin: 1.5rem 0;
}

.customer-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.customer-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.use-customer-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.use-customer-button:hover {
  background: #059669;
}

.customer-info p {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
}

/* Transfer Button */
.transfer-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.transfer-button:hover:not(:disabled) {
  background: #2563eb;
}

.transfer-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inactive-policy {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.transfer-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
}

.transfer-note {
  margin: 0.5rem 0 0 0;
  color: #0369a1;
  font-size: 0.875rem;
  font-style: italic;
}
</style>
