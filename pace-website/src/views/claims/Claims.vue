<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ChevronLeft, ChevronRight, Calendar, Shield, FileText, AlertCircle, Plus, FileSearch } from 'lucide-vue-next'
import claimsService, { type Claim, type CreateClaimData } from '../../services/claims.service'
// import { useAuthStore } from '../../stores/auth'

const icons = { ChevronLeft, ChevronRight, Calendar, Shield, FileText, AlertCircle, Plus, FileSearch }
void icons

// const authStore = useAuthStore() // Not needed for this flow
const currentStep = ref(0) // 0 = choice screen, 1 = accident details, 2 = documents
const totalSteps = 2
const showChoiceScreen = ref(true)
const existingClaims = ref<Claim[]>([])
const availablePolicies = ref<any[]>([])
const selectedClaim = ref<Claim | null>(null)
const selectedPolicy = ref<any>(null)
const loading = ref(false)
const customerNumber = ref('')
const showPolicySelection = ref(false)
const showClaimSelection = ref(false)

const claimData = reactive({
  fromCustomer: '',
  fromPolicy: '',
  documents: {},
  requiredDocuments: [
    'Claim Authorization Form.pdf',
    'Medical Records Release.pdf',
    'Vehicle Inspection Agreement.pdf',
    'Settlement Agreement.pdf',
    'Proof of Loss Statement.pdf'
  ]
})

// Removed insurers array as it's no longer needed with the new model structure

const isCustomerNumberValid = computed(() => {
  return customerNumber.value.trim() !== ''
})

// const isStepValid = computed(() => {
//   switch (currentStep.value) {
//     case 1:
//       return claimData.fromCustomer && claimData.fromPolicy
//     case 2:
//       return true
//     default:
//       return false
//   }
// })

const loadExistingClaims = async () => {
  if (!customerNumber.value) return
  
  try {
    loading.value = true
    existingClaims.value = await claimsService.getClaimsByCustomerNumber(customerNumber.value)
    showClaimSelection.value = true
  } catch (error) {
    console.error('Error loading existing claims:', error)
    alert('Error loading existing claims. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadAvailablePolicies = async () => {
  if (!customerNumber.value) return
  
  try {
    loading.value = true
    availablePolicies.value = await claimsService.getPoliciesByCustomerNumber(customerNumber.value)
    showPolicySelection.value = true
  } catch (error) {
    console.error('Error loading policies:', error)
    alert('Error loading policies. Please try again.')
  } finally {
    loading.value = false
  }
}

const startNewClaim = () => {
  if (!isCustomerNumberValid.value) {
    alert('Please enter a customer number first')
    return
  }
  
  // Load available policies for this customer
  loadAvailablePolicies()
}

const selectPolicy = async (policy: any) => {
  selectedPolicy.value = policy
  showChoiceScreen.value = false
  showPolicySelection.value = false
  
  try {
    loading.value = true
    
    // Create the claims_details record immediately
    const createData: CreateClaimData = {
      from_customer: customerNumber.value.trim(),
      from_policy: policy.id.toString(),
      documents: {}
    }
    
    const newClaim = await claimsService.createClaim(createData)
    selectedClaim.value = newClaim
    
    // Set claim data with selected policy
    Object.assign(claimData, {
      fromCustomer: customerNumber.value,
      fromPolicy: policy.id.toString(),
      documents: newClaim.documents || {},
      requiredDocuments: [
        'Claim Authorization Form.pdf',
        'Medical Records Release.pdf',
        'Vehicle Inspection Agreement.pdf',
        'Settlement Agreement.pdf',
        'Proof of Loss Statement.pdf'
      ]
    })
    
    // Move to documents step since claim is created
    currentStep.value = 2
    
  } catch (error) {
    console.error('Error creating claim:', error)
    alert('Error creating claim. Please try again.')
    // Go back to policy selection
    showPolicySelection.value = true
  } finally {
    loading.value = false
  }
}

const continueExistingClaim = (claim: Claim) => {
  selectedClaim.value = claim
  showChoiceScreen.value = false
  showClaimSelection.value = false
  currentStep.value = 2 // Skip to documents step
  
  // Populate claim data from existing claim
  Object.assign(claimData, {
    fromCustomer: claim.from_customer,
    fromPolicy: claim.from_policy,
    documents: claim.documents || {},
    requiredDocuments: [
      'Claim Authorization Form.pdf',
      'Medical Records Release.pdf',
      'Vehicle Inspection Agreement.pdf',
      'Settlement Agreement.pdf',
      'Proof of Loss Statement.pdf'
    ]
  })
}

const backToChoiceScreen = () => {
  showChoiceScreen.value = true
  showPolicySelection.value = false
  showClaimSelection.value = false
  currentStep.value = 0
  selectedClaim.value = null
  selectedPolicy.value = null
  existingClaims.value = []
  availablePolicies.value = []
}

// const nextStep = () => {
//   if (currentStep.value < totalSteps && isStepValid.value) {
//     currentStep.value++
//   }
// }

// const prevStep = () => {
//   if (currentStep.value > 1) {
//     currentStep.value--
//   } else if (currentStep.value === 1) {
//     // Go back to choice screen
//     backToChoiceScreen()
//   }
// }

const submitClaim = async () => {
  if (!selectedClaim.value) {
    alert('No claim to submit. Please select a policy first.')
    return
  }
  
  try {
    loading.value = true
    
    // Mark the claim as completed
    await claimsService.updateClaim(selectedClaim.value.id, {
      completed_at: new Date().toISOString(),
      active: false
    })
    
    alert('Claim submitted successfully! You will receive a claim number via email.')
    
    // Reset to choice screen
    backToChoiceScreen()
    
  } catch (error) {
    console.error('Error submitting claim:', error)
    alert('Error submitting claim. Please try again.')
  } finally {
    loading.value = false
  }
}

const downloadDocument = async (documentName: string) => {
  if (!selectedClaim.value?.documents || !selectedClaim.value.documents[documentName]) {
    alert('Document not found')
    return
  }
  
  const documentData = selectedClaim.value.documents[documentName]
  
  try {
    loading.value = true
    
    // Download the file from the server
    const blob = await claimsService.downloadDocument(selectedClaim.value.id, documentName)
    
    // Create a download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = documentData.fileName || documentName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error downloading document:', error)
    alert('Error downloading document. Please try again.')
  } finally {
    loading.value = false
  }
}

const uploadDocument = async (documentName: string) => {
  if (!selectedClaim.value) {
    alert('No claim selected. Please select a policy first.')
    return
  }
  
  // Create file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt'
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    try {
      loading.value = true
      
      // Upload document to the claim
      const updatedClaim = await claimsService.uploadDocument(selectedClaim.value!.id, documentName, file)
      selectedClaim.value = updatedClaim
      
      // Update local documents
      claimData.documents = updatedClaim.documents || {}
      
      alert(`Document ${documentName} uploaded successfully!`)
      
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Error uploading document. Please try again.')
    } finally {
      loading.value = false
    }
  }
  
  input.click()
}

const deleteDocument = async (documentName: string) => {
  if (!selectedClaim.value) return
  
  if (!confirm(`Are you sure you want to delete ${documentName}?`)) return
  
  try {
    await claimsService.deleteDocument(selectedClaim.value.id, documentName)
    alert(`Document ${documentName} deleted successfully!`)
    // Reload the claim to get updated documents
    const updatedClaim = await claimsService.getClaim(selectedClaim.value.id)
    selectedClaim.value = updatedClaim
    // Update local documents
    claimData.documents = updatedClaim.documents || {}
  } catch (error) {
    console.error('Error deleting document:', error)
    alert('Error deleting document. Please try again.')
  }
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getClaimStatusColor = (claim: Claim) => {
  if (claim.completed_at) return '#10b981' // completed
  if (claim.active) return '#3b82f6' // active/processing
  return '#6b7280' // inactive
}

const getClaimStatusText = (claim: Claim) => {
  if (claim.completed_at) return 'completed'
  if (claim.active) return 'active'
  return 'inactive'
}

const getUploadedDocumentsCount = (claim: Claim) => {
  if (!claim.documents) return 0
  return Object.keys(claim.documents).length
}

const getPolicyStatusText = (status: number) => {
  switch (status) {
    case 1: return 'Active'
    case 2: return 'Pending'
    case 3: return 'Cancelled'
    case 4: return 'Expired'
    default: return 'Unknown'
  }
}

const getPolicyStatusClass = (status: number) => {
  switch (status) {
    case 1: return 'status-active'
    case 2: return 'status-pending'
    case 3: return 'status-cancelled'
    case 4: return 'status-expired'
    default: return 'status-unknown'
  }
}

// No need to load claims on mount - user will enter customer number first
</script>

<template>
  <div class="claims-page">
    <div class="claims-header">
      <h1 class="claims-title">File Insurance Claim</h1>
      <div v-if="!showChoiceScreen" class="progress-indicator">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }"></div>
        </div>
        <span class="progress-text">Step {{ currentStep }} of {{ totalSteps }}</span>
      </div>
    </div>

    <!-- Customer Number Input -->
    <div v-if="showChoiceScreen" class="customer-input-section">
      <div class="customer-input-container">
        <h2 class="customer-input-title">Enter Customer Number</h2>
        <p class="customer-input-description">Please enter your customer number to access claims services.</p>
        
        <div class="customer-input-form">
          <input
            v-model="customerNumber"
            type="text"
            class="customer-input"
            placeholder="Enter your customer number"
            @keyup.enter="isCustomerNumberValid && loadExistingClaims()"
          />
        </div>
      </div>
    </div>

    <!-- Choice Screen -->
    <div v-if="showChoiceScreen && isCustomerNumberValid" class="choice-screen">
      <div class="choice-container">
        <h2 class="choice-title">What would you like to do?</h2>
        <p class="choice-description">Choose whether to start a new claim or continue with an existing one.</p>
        
        <div class="choice-options">
          <div class="choice-option" @click="startNewClaim">
            <div class="choice-icon">
              <Plus class="icon" />
            </div>
            <h3 class="choice-option-title">Start New Claim</h3>
            <p class="choice-option-description">Begin filing a new insurance claim</p>
          </div>
          
          <div class="choice-option" @click="loadExistingClaims">
            <div class="choice-icon">
              <FileSearch class="icon" />
            </div>
            <h3 class="choice-option-title">Continue Existing Claim</h3>
            <p class="choice-option-description">Continue with a claim you've already started</p>
          </div>
        </div>
        
        <!-- Existing Claims List -->
        <div v-if="showClaimSelection && existingClaims.length > 0" class="existing-claims">
          <h3 class="existing-claims-title">Your Existing Claims</h3>
          <div class="claims-list">
            <div 
              v-for="claim in existingClaims" 
              :key="claim.id" 
              class="claim-item"
              @click="continueExistingClaim(claim)"
            >
              <div class="claim-info">
                <div class="claim-header">
                  <span class="claim-date">{{ formatDate(claim.created_at) }}</span>
                  <span 
                    class="claim-status" 
                    :style="{ backgroundColor: getClaimStatusColor(claim) }"
                  >
                    {{ getClaimStatusText(claim) }}
                  </span>
                </div>
                <p class="claim-description">Claim for Policy #{{ claim.from_policy }}</p>
                <p class="claim-location">Customer ID: {{ claim.from_customer }}</p>
              </div>
              <div class="claim-documents">
                <span class="documents-count">
                  {{ getUploadedDocumentsCount(claim) }} / {{ claimData.requiredDocuments.length }} documents uploaded
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="showClaimSelection && !loading && existingClaims.length === 0" class="no-claims">
          <p class="no-claims-text">No existing claims found for customer number {{ customerNumber }}.</p>
        </div>
      </div>
    </div>

    <!-- Policy Selection Screen -->
    <div v-if="showPolicySelection" class="policy-selection-screen">
      <div class="policy-selection-container">
        <h2 class="policy-selection-title">Select Policy for New Claim</h2>
        <p class="policy-selection-description">Choose a policy to create a new claim for customer {{ customerNumber }}.</p>
        
        <div v-if="loading" class="loading-message">
          <p>Loading policies...</p>
        </div>
        
        <div v-else-if="availablePolicies.length > 0" class="policies-list">
          <div 
            v-for="policy in availablePolicies" 
            :key="policy.id" 
            class="policy-item"
            @click="selectPolicy(policy)"
          >
            <div class="policy-info">
              <div class="policy-header">
                <span class="policy-id">Policy #{{ policy.id }}</span>
                <span class="policy-status" :class="getPolicyStatusClass(policy.policy_status)">
                  {{ getPolicyStatusText(policy.policy_status) }}
                </span>
              </div>
              <p class="policy-details">Effective Date: {{ formatDate(policy.effective_date) }}</p>
              <p class="policy-details">Province: {{ policy.province }}</p>
              <p class="policy-details">Total Price: ${{ policy.total_price }}</p>
            </div>
          </div>
        </div>
        
        <div v-else class="no-policies">
          <p class="no-policies-text">No active policies found for customer number {{ customerNumber }}.</p>
        </div>
        
        <div class="policy-selection-actions">
          <button @click="backToChoiceScreen" class="btn btn-secondary">
            Back to Options
          </button>
        </div>
      </div>
    </div>

    <!-- Step Navigation -->
    <div v-if="!showChoiceScreen" class="step-navigation">
      <div class="step-item step-active">
        <div class="step-number">
          <FileText class="step-icon" />
        </div>
        <span class="step-label">Required Documents</span>
      </div>
    </div>

    <!-- Step Content -->
    <div v-if="!showChoiceScreen" class="step-content">
      <!-- Step 1 removed - going directly to documents after policy selection -->

      <!-- Step 2: Required Documents -->
      <div v-if="currentStep === 2" class="step-panel">
        <div class="panel-header">
          <FileText class="panel-icon" />
          <h2 class="panel-title">Required Documents</h2>
        </div>
        
        <div class="documents-container">
          <div class="summary-section">
            <h3 class="summary-title">Claim Summary</h3>
            <div class="summary-card">
              <div class="summary-item">
                <span class="summary-label">Customer ID:</span>
                <span class="summary-value">{{ claimData.fromCustomer }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Policy ID:</span>
                <span class="summary-value">{{ claimData.fromPolicy }}</span>
              </div>
              <div class="summary-item" v-if="selectedClaim">
                <span class="summary-label">Created:</span>
                <span class="summary-value">{{ formatDate(selectedClaim.created_at) }}</span>
              </div>
              <div class="summary-item" v-if="selectedClaim?.completed_at">
                <span class="summary-label">Completed:</span>
                <span class="summary-value">{{ formatDate(selectedClaim.completed_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="documents-section">
            <h3 class="documents-title">Documents to Sign</h3>
            <p class="documents-description">
              The following documents will be sent to your email address for review and signature:
            </p>
            
            <div class="documents-list">
              <div
                v-for="(document, index) in claimData.requiredDocuments"
                :key="index"
                class="document-item"
                :class="{ 'document-uploaded': selectedClaim?.documents && selectedClaim.documents[document] }"
              >
                <div class="document-info">
                  <FileText class="document-icon" />
                  <div class="document-details">
                    <span class="document-name">{{ document }}</span>
                    <span class="document-description">
                      {{ selectedClaim?.documents && selectedClaim.documents[document] ? 'Document uploaded' : 'Required for claim processing' }}
                    </span>
                  </div>
                </div>
                <div class="document-actions">
                  <button
                    v-if="!selectedClaim?.documents || !selectedClaim.documents[document]"
                    @click="uploadDocument(document)"
                    class="upload-button"
                  >
                    Upload
                  </button>
                  <template v-else>
                    <button
                      @click="deleteDocument(document)"
                      class="delete-button"
                    >
                      Delete
                    </button>
                    <button
                      @click="downloadDocument(document)"
                      class="download-button"
                    >
                      Download
                    </button>
                  </template>
                </div>
              </div>
            </div>
            
            <div v-if="selectedClaim && selectedClaim.documents" class="uploaded-documents">
              <h4 class="uploaded-title">Uploaded Documents</h4>
              <div class="uploaded-list">
                <div 
                  v-for="(_, documentName) in selectedClaim.documents" 
                  :key="documentName"
                  class="uploaded-item"
                >
                  <FileText class="uploaded-icon" />
                  <span class="uploaded-name">{{ documentName }}</span>
                  <span class="uploaded-status">✓ Uploaded</span>
                </div>
              </div>
            </div>
            
            <div class="documents-notice">
              <div class="notice-box">
                <Shield class="notice-icon" />
                <div class="notice-content">
                  <h4 class="notice-title">Next Steps</h4>
                  <ul class="notice-list">
                    <li>You will receive an email with all required documents within 24 hours</li>
                    <li>Review and sign each document carefully</li>
                    <li>Return signed documents within 7 business days</li>
                    <li>A claims adjuster will contact you to schedule an inspection</li>
                    <li>Processing typically takes 5-10 business days after all documents are received</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Navigation Buttons -->
    <div v-if="!showChoiceScreen" class="step-actions">
      <button
        @click="backToChoiceScreen"
        class="btn btn-secondary"
      >
        <ChevronLeft class="btn-icon" />
        Back to Options
      </button>
      
      <div class="spacer"></div>
      
      <button
        @click="submitClaim"
        class="btn btn-success"
        :disabled="loading"
      >
        <FileText class="btn-icon" />
        {{ loading ? 'Submitting...' : 'Submit Claim' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.claims-page {
  max-width: 900px;
  margin: 0 auto;
}

.claims-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.claims-title {
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

.step-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
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

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.step-active .step-label {
  color: #2A525A;
  font-weight: 600;
}

.step-divider {
  width: 4rem;
  height: 2px;
  background: #e5e7eb;
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

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.panel-icon {
  width: 2rem;
  height: 2rem;
  color: #ffa242;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.form-group.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
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

.info-notice {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
}

.notice-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #0ea5e9;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0369a1;
  margin: 0 0 0.5rem 0;
}

.notice-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #0369a1;
}

.notice-list li {
  margin-bottom: 0.25rem;
}

.documents-container {
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

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-weight: 500;
  color: #6b7280;
}

.summary-value {
  font-weight: 600;
  color: #1f2937;
}

.documents-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.documents-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.documents-description {
  color: #6b7280;
  margin: 0;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.document-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.document-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.document-name {
  font-weight: 500;
  color: #1f2937;
}

.document-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.download-button {
  padding: 0.5rem 1rem;
  background: #2A525A;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.download-button:hover {
  background: #1e3a40;
}

.documents-notice {
  margin-top: 1.5rem;
}

.notice-box {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 0.5rem;
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

/* Customer Input Styles */
.customer-input-section {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.customer-input-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.customer-input-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.customer-input-description {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.customer-input-form {
  display: flex;
  justify-content: center;
}

.customer-input {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  text-align: center;
  transition: border-color 0.2s;
}

.customer-input:focus {
  outline: none;
  border-color: #ffa242;
}

/* Choice Screen Styles */
.choice-screen {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.choice-container {
  max-width: 800px;
  margin: 0 auto;
}

.choice-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1rem;
}

.choice-description {
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 3rem;
}

.choice-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.choice-option {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-option:hover:not(.disabled) {
  border-color: #ffa242;
  background: #fff7ed;
}

.choice-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.choice-icon {
  width: 4rem;
  height: 4rem;
  background: #ffa242;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.choice-icon .icon {
  width: 2rem;
  height: 2rem;
  color: #2A525A;
}

.choice-option-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.choice-option-description {
  color: #6b7280;
  margin: 0;
}

/* Existing Claims Styles */
.existing-claims {
  margin-top: 2rem;
}

.existing-claims-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.claims-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.claim-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.claim-item:hover {
  border-color: #ffa242;
  background: #fff7ed;
}

.claim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.claim-date {
  font-weight: 500;
  color: #6b7280;
}

.claim-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
}

.claim-description {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.claim-location {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.claim-documents {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.documents-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.no-claims {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* Policy Selection Styles */
.policy-selection-screen {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.policy-selection-container {
  max-width: 800px;
  margin: 0 auto;
}

.policy-selection-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1rem;
}

.policy-selection-description {
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
}

.loading-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.policies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.policy-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.policy-item:hover {
  border-color: #ffa242;
  background: #fff7ed;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.policy-id {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}

.policy-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-expired {
  background: #f3f4f6;
  color: #374151;
}

.status-unknown {
  background: #e5e7eb;
  color: #6b7280;
}

.policy-details {
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.no-policies {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.policy-selection-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

/* Document Upload Styles */
.document-uploaded {
  background: #f0fdf4;
  border-color: #10b981;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.upload-button {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-button:hover {
  background: #059669;
}

.delete-button {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background: #dc2626;
}

.uploaded-documents {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 0.5rem;
}

.uploaded-title {
  font-size: 1rem;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 1rem;
}

.uploaded-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.uploaded-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
}

.uploaded-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
}

.uploaded-name {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
}

.uploaded-status {
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}

@media (max-width: 768px) {
  .claims-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .choice-options {
    grid-template-columns: 1fr;
  }
  
  .step-navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step-item {
    flex-direction: row;
    gap: 1rem;
  }
  
  .step-divider {
    width: 2px;
    height: 2rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-item {
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }
  
  .document-item {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .document-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .claim-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>