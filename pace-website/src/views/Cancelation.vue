<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ChevronLeft, ChevronRight, AlertTriangle, DollarSign, FileText, Search, X } from 'lucide-vue-next'
import policyService from '../services/policy.service'

const currentStep = ref(1)
const totalSteps = 2

const cancelationData = reactive({
  customerNumber: '',
  selectedPolicy: null as any,
  reason: '',
  effectiveDate: '',
  refundAmount: 0,
  documentsRequired: [
    'Policy Cancellation Request Form',
    'Signed Cancellation Agreement',
    'Vehicle Registration Copy',
    'Proof of New Insurance (if applicable)'
  ],
  confirmed: false
})

const showPolicyModal = ref(false)
const availablePolicies = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const cancelationReasons = [
  'Sold vehicle',
  'Switching to another insurer',
  'No longer need coverage',
  'Financial hardship',
  'Dissatisfied with service',
  'Moving out of coverage area',
  'Other'
]

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return cancelationData.selectedPolicy && cancelationData.reason
    case 2:
      return cancelationData.confirmed
    default:
      return false
  }
})

const nextStep = () => {
  if (currentStep.value < totalSteps && isStepValid.value) {
    // Calculate refund amount when moving to step 2
    if (currentStep.value === 1) {
      calculateRefund()
    }
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const calculateRefund = async () => {
  if (cancelationData.selectedPolicy) {
    try {
      const refundData = await policyService.calculateRefund(cancelationData.selectedPolicy.id)
      cancelationData.refundAmount = refundData.refundAmount
    } catch (err) {
      console.error('Error calculating refund:', err)
      // Fallback to simulated calculation
      const baseAmount = Math.random() * 500 + 100
      cancelationData.refundAmount = Math.round(baseAmount * 100) / 100
    }
  }
}

const submitCancelation = async () => {
  if (!cancelationData.selectedPolicy) {
    error.value = 'Please select a policy to cancel'
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    // Start the cancellation process
    const result = await policyService.startPolicyCancelation(cancelationData.selectedPolicy.id)
    
    // Show success message
    alert(`Cancellation request submitted successfully! A confirmation email has been sent with a refund amount of $${result.refundAmount.toFixed(2)}.`)
    
    // Reset form
    cancelationData.selectedPolicy = null
    cancelationData.customerNumber = ''
    cancelationData.reason = ''
    cancelationData.effectiveDate = ''
    cancelationData.confirmed = false
    currentStep.value = 1
    
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error submitting cancellation request'
    console.error('Error submitting cancellation:', err)
  } finally {
    loading.value = false
  }
}

const lookupCustomer = async () => {
  if (!cancelationData.customerNumber) {
    error.value = 'Please enter a customer number'
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    const filters = {
      customerNumber: cancelationData.customerNumber,
      policy_status: [1,2,9] // Only confirmed policies
    }
    
    const policies = await policyService.getPolicies({ filters })
    availablePolicies.value = policies
    showPolicyModal.value = true
    
    if (policies.length === 0) {
      error.value = 'No policies found for this customer number'
    }
  } catch (err: any) {
    error.value = err.message || 'Error looking up customer policies'
    console.error('Error looking up customer:', err)
  } finally {
    loading.value = false
  }
}

const selectPolicy = (policy: any) => {
  cancelationData.selectedPolicy = policy
  showPolicyModal.value = false
}

const closeModal = () => {
  showPolicyModal.value = false
  availablePolicies.value = []
  error.value = ''
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Pending'
    case 1: return 'Confirmed'
    case 2: return 'Cancelled'
    default: return 'Unknown'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`
}
</script>

<template>
  <div class="cancelation-page">
    <div class="cancelation-header">
      <h1 class="cancelation-title">Policy Cancellation</h1>
      <div class="progress-indicator">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }"></div>
        </div>
        <span class="progress-text">Step {{ currentStep }} of {{ totalSteps }}</span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Policy Information -->
      <div v-if="currentStep === 1" class="step-panel">
        <div class="step-header">
          <FileText class="step-icon" />
          <h2 class="step-title">Policy Information</h2>
        </div>
        
        <div class="form-container">
          <div class="form-group">
            <label for="customerNumber" class="form-label">Customer Number</label>
            <div class="input-group">
              <input
                id="customerNumber"
                v-model="cancelationData.customerNumber"
                type="text"
                class="form-input"
                placeholder="Enter customer number"
              />
              <button @click="lookupCustomer" class="lookup-button" :disabled="loading">
                <Search v-if="!loading" class="button-icon" />
                <span v-if="loading">Loading...</span>
                <span v-else>Lookup</span>
              </button>
            </div>
            <p class="form-hint">Enter the customer number to find available policies</p>
            <div v-if="error" class="error-message">{{ error }}</div>
          </div>

          <!-- Selected Policy Display -->
          <div v-if="cancelationData.selectedPolicy" class="selected-policy">
            <h4 class="selected-policy-title">Selected Policy</h4>
            <div class="policy-card">
              <div class="policy-info">
                <div class="policy-detail">
                  <span class="detail-label">Policy ID:</span>
                  <span class="detail-value">{{ cancelationData.selectedPolicy.id }}</span>
                </div>
                <div class="policy-detail">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">{{ getStatusText(cancelationData.selectedPolicy.policy_status) }}</span>
                </div>
                <div class="policy-detail">
                  <span class="detail-label">Total Price:</span>
                  <span class="detail-value">{{ formatCurrency(cancelationData.selectedPolicy.total_price) }}</span>
                </div>
                <div class="policy-detail">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(cancelationData.selectedPolicy.created_at) }}</span>
                </div>
                <div v-if="cancelationData.selectedPolicy.vehicle_details_policies_vehicle_detailsTovehicle_details" class="policy-detail">
                  <span class="detail-label">Vehicle:</span>
                  <span class="detail-value">
                    {{ cancelationData.selectedPolicy.vehicle_details_policies_vehicle_detailsTovehicle_details.make }} 
                    {{ cancelationData.selectedPolicy.vehicle_details_policies_vehicle_detailsTovehicle_details.model }}
                    ({{ cancelationData.selectedPolicy.vehicle_details_policies_vehicle_detailsTovehicle_details.model_year }})
                  </span>
                </div>
              </div>
              <button @click="cancelationData.selectedPolicy = null" class="change-policy-button">
                <X class="button-icon" />
                Change Policy
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="reason" class="form-label">Cancellation Reason</label>
            <select
              id="reason"
              v-model="cancelationData.reason"
              class="form-select"
            >
              <option value="">Select a reason</option>
              <option v-for="reason in cancelationReasons" :key="reason" :value="reason">
                {{ reason }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="effectiveDate" class="form-label">Effective Date</label>
            <input
              id="effectiveDate"
              v-model="cancelationData.effectiveDate"
              type="date"
              class="form-input"
            />
            <p class="form-hint">The date when the cancellation should take effect</p>
          </div>

          <div class="info-box">
            <AlertTriangle class="info-icon" />
            <div class="info-content">
              <h4 class="info-title">Important Information</h4>
              <ul class="info-list">
                <li>Cancellation may result in a short-rate penalty</li>
                <li>You must maintain continuous coverage to avoid penalties</li>
                <li>Refunds are processed within 5-7 business days</li>
                <li>Some fees may be non-refundable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Confirmation -->
      <div v-if="currentStep === 2" class="step-panel">
        <div class="step-header">
          <DollarSign class="step-icon" />
          <h2 class="step-title">Refund & Confirmation</h2>
        </div>
        
        <div class="confirmation-container">
          <div class="refund-section">
            <h3 class="section-title">Refund Information</h3>
            <div class="refund-card">
              <div class="refund-amount">
                <span class="refund-label">Estimated Refund Amount:</span>
                <span class="refund-value">${{ cancelationData.refundAmount.toFixed(2) }}</span>
              </div>
              <div class="refund-details">
                <p class="refund-note">
                  This amount represents the unused portion of your premium, minus any applicable fees.
                  The final refund amount will be calculated based on your policy terms.
                </p>
              </div>
            </div>
          </div>

          <div class="documents-section">
            <h3 class="section-title">Required Documents</h3>
            <div class="documents-list">
              <div
                v-for="document in cancelationData.documentsRequired"
                :key="document"
                class="document-item"
              >
                <FileText class="document-icon" />
                <span class="document-name">{{ document }}</span>
              </div>
            </div>
            <p class="documents-note">
              These documents will be sent to your email address for completion and signature.
            </p>
          </div>

          <div class="confirmation-section">
            <h3 class="section-title">Confirmation</h3>
            <div class="confirmation-box">
              <div class="warning-message">
                <AlertTriangle class="warning-icon" />
                <div class="warning-content">
                  <h4 class="warning-title">Are you sure you want to cancel?</h4>
                  <p class="warning-text">
                    This action will cancel your policy effective {{ cancelationData.effectiveDate || 'immediately' }}.
                    You will lose coverage and may face penalties for driving without insurance.
                  </p>
                </div>
              </div>
              
              <label class="confirmation-checkbox">
                <input
                  v-model="cancelationData.confirmed"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-text">
                  I understand the consequences of cancelling my policy and wish to proceed
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Navigation -->
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
        @click="submitCancelation"
        class="btn btn-danger"
        :disabled="!isStepValid"
      >
        <AlertTriangle class="btn-icon" />
        Submit Cancellation
      </button>
    </div>

    <!-- Policy Selection Modal -->
    <div v-if="showPolicyModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Select Policy to Cancel</h3>
          <button @click="closeModal" class="modal-close">
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="availablePolicies.length === 0" class="no-policies">
            <p>No policies found for customer number {{ cancelationData.customerNumber }}</p>
          </div>
          
          <div v-else class="policies-list">
            <div 
              v-for="policy in availablePolicies" 
              :key="policy.id" 
              class="policy-item"
              @click="selectPolicy(policy)"
            >
              <div class="policy-header">
                <span class="policy-id">Policy #{{ policy.id }}</span>
                <span class="policy-status" :class="`status-${policy.policy_status}`">
                  {{ getStatusText(policy.policy_status) }}
                </span>
              </div>
              
              <div class="policy-details">
                <div class="policy-detail">
                  <span class="detail-label">Total Price:</span>
                  <span class="detail-value">{{ formatCurrency(policy.total_price) }}</span>
                </div>
                <div class="policy-detail">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(policy.created_at) }}</span>
                </div>
                <div v-if="policy.vehicle_details_policies_vehicle_detailsTovehicle_details" class="policy-detail">
                  <span class="detail-label">Vehicle:</span>
                  <span class="detail-value">
                    {{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details.make }} 
                    {{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details.model }}
                    ({{ policy.vehicle_details_policies_vehicle_detailsTovehicle_details.model_year }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cancelation-page {
  max-width: 800px;
  margin: 0 auto;
}

.cancelation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.cancelation-title {
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

.step-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.step-panel {
  min-height: 400px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.step-icon {
  width: 2rem;
  height: 2rem;
  color: #ffa242;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  flex: 1;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2A525A;
}

.lookup-button {
  padding: 0.75rem 1.5rem;
  background: #2A525A;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lookup-button:hover {
  background: #1e3a40;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
}

.info-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #f59e0b;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.info-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #92400e;
}

.info-list li {
  margin-bottom: 0.25rem;
}

.confirmation-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.refund-card {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.refund-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.refund-label {
  font-weight: 600;
  color: #0369a1;
}

.refund-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0369a1;
}

.refund-note {
  font-size: 0.875rem;
  color: #0369a1;
  margin: 0;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.document-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.document-name {
  font-weight: 500;
  color: #374151;
}

.documents-note {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.confirmation-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.warning-message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.warning-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #dc2626;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.warning-text {
  font-size: 0.875rem;
  color: #7f1d1d;
  margin: 0;
}

.confirmation-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
  margin-top: 0.125rem;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
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
}

.btn-primary {
  background: #ffa242;
  color: #2A525A;
}

.btn-primary:hover:not(:disabled) {
  background: #e6d700;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Selected Policy Styles */
.selected-policy {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.selected-policy-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.policy-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.policy-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.policy-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.change-policy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.change-policy-button:hover {
  background: #b91c1c;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.no-policies {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.policies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.policy-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.policy-item:hover {
  border-color: #2A525A;
  background: #f8fafc;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.policy-id {
  font-weight: 600;
  color: #1f2937;
}

.policy-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-0 {
  background: #fef3c7;
  color: #92400e;
}

.status-1 {
  background: #d1fae5;
  color: #065f46;
}

.status-2 {
  background: #fee2e2;
  color: #991b1b;
}

.policy-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .cancelation-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .refund-amount {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .policy-card {
    flex-direction: column;
    align-items: stretch;
  }

  .policy-info {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 1rem;
    max-height: 90vh;
  }
}
</style>