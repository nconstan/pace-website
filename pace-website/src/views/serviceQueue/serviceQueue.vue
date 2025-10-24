<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, Calendar, User, Car, Download, Eye, AlertCircle, CheckCircle } from 'lucide-vue-next'
import claimsService, { type Claim } from '../../services/claims.service'

const activeClaims = ref<Claim[]>([])
const selectedClaim = ref<Claim | null>(null)
const loading = ref(false)
const error = ref('')

// Fetch all active claims
const fetchActiveClaims = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Get all claims and filter for active ones
    const allClaims = await claimsService.getClaims()
    activeClaims.value = allClaims.filter(claim => claim.active && !claim.completed_at)
    
  } catch (err: any) {
    console.error('Error fetching active claims:', err)
    error.value = 'Failed to load active claims'
  } finally {
    loading.value = false
  }
}

// View claim details
const viewClaim = (claim: Claim) => {
  selectedClaim.value = claim
}

// Close claim details
const closeClaimDetails = () => {
  selectedClaim.value = null
}

// Download document
const downloadDocument = async (documentName: string, documentData: any) => {
  if (!selectedClaim.value) {
    alert('No claim selected')
    return
  }
  
  try {
    loading.value = true
    
    // Download the file from the server
    const blob = await claimsService.downloadDocument(selectedClaim.value.id.toString(), documentName)
    
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

// Format date
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get claim status color
const getClaimStatusColor = (claim: Claim) => {
  if (claim.completed_at) return '#10b981' // completed
  if (claim.active) return '#3b82f6' // active/processing
  return '#6b7280' // inactive
}

// Get claim status text
const getClaimStatusText = (claim: Claim) => {
  if (claim.completed_at) return 'Completed'
  if (claim.active) return 'Active'
  return 'Inactive'
}

// Get uploaded documents count
const getUploadedDocumentsCount = (claim: Claim) => {
  if (!claim.documents) return 0
  return Object.keys(claim.documents).length
}

// Get total required documents
const getTotalRequiredDocuments = () => {
  return 5 // Based on the required documents in Claims.vue
}

// Get completion percentage
const getCompletionPercentage = (claim: Claim) => {
  const uploaded = getUploadedDocumentsCount(claim)
  const total = getTotalRequiredDocuments()
  return Math.round((uploaded / total) * 100)
}

// Load claims on component mount
onMounted(() => {
  fetchActiveClaims()
})
</script>

<template>
  <div class="service-queue">
    <div class="queue-header">
      <h1 class="queue-title">Service Queue</h1>
      <p class="queue-description">Active claims requiring attention</p>
      <button @click="fetchActiveClaims" class="refresh-button" :disabled="loading">
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <AlertCircle class="error-icon" />
      <p class="error-message">{{ error }}</p>
      <button @click="fetchActiveClaims" class="btn btn-primary">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading && activeClaims.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-message">Loading active claims...</p>
    </div>

    <!-- No Claims State -->
    <div v-else-if="!loading && activeClaims.length === 0" class="no-claims-state">
      <CheckCircle class="no-claims-icon" />
      <h3 class="no-claims-title">No Active Claims</h3>
      <p class="no-claims-message">All claims are up to date!</p>
    </div>

    <!-- Claims List -->
    <div v-else class="claims-container">
      <div class="claims-grid">
        <div 
          v-for="claim in activeClaims" 
          :key="claim.id" 
          class="claim-card"
          @click="viewClaim(claim)"
        >
          <div class="claim-header">
            <div class="claim-id">
              <FileText class="claim-icon" />
              <span>Claim #{{ claim.id }}</span>
            </div>
            <div class="claim-status" :style="{ backgroundColor: getClaimStatusColor(claim) }">
              {{ getClaimStatusText(claim) }}
            </div>
          </div>

          <div class="claim-details">
            <div class="claim-info">
              <div class="info-item">
                <User class="info-icon" />
                <span>Customer: {{ claim.from_customer }}</span>
              </div>
              <div class="info-item">
                <Car class="info-icon" />
                <span>Policy: {{ claim.from_policy }}</span>
              </div>
              <div class="info-item">
                <Calendar class="info-icon" />
                <span>{{ formatDate(claim.created_at) }}</span>
              </div>
            </div>

            <div class="claim-progress">
              <div class="progress-header">
                <span class="progress-label">Document Progress</span>
                <span class="progress-percentage">{{ getCompletionPercentage(claim) }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${getCompletionPercentage(claim)}%` }"
                ></div>
              </div>
              <div class="progress-details">
                {{ getUploadedDocumentsCount(claim) }} of {{ getTotalRequiredDocuments() }} documents uploaded
              </div>
            </div>
          </div>

          <div class="claim-actions">
            <button class="view-button">
              <Eye class="button-icon" />
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Claim Details Modal -->
    <div v-if="selectedClaim" class="modal-overlay" @click="closeClaimDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Claim Details - #{{ selectedClaim.id }}</h2>
          <button @click="closeClaimDetails" class="close-button">×</button>
        </div>

        <div class="modal-body">
          <!-- Claim Information -->
          <div class="details-section">
            <h3 class="section-title">Claim Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Claim ID:</span>
                <span class="info-value">{{ selectedClaim.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Customer ID:</span>
                <span class="info-value">{{ selectedClaim.from_customer }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Policy ID:</span>
                <span class="info-value">{{ selectedClaim.from_policy }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span class="info-value">{{ formatDate(selectedClaim.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value status-badge" :style="{ backgroundColor: getClaimStatusColor(selectedClaim) }">
                  {{ getClaimStatusText(selectedClaim) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Uploaded Documents -->
          <div class="details-section">
            <h3 class="section-title">Uploaded Documents</h3>
            
            <div v-if="!selectedClaim.documents || Object.keys(selectedClaim.documents).length === 0" class="no-documents">
              <FileText class="no-documents-icon" />
              <p class="no-documents-message">No documents uploaded yet</p>
            </div>

            <div v-else class="documents-list">
              <div 
                v-for="(documentData, documentName) in selectedClaim.documents" 
                :key="documentName"
                class="document-item"
              >
                <div class="document-info">
                  <FileText class="document-icon" />
                  <div class="document-details">
                    <span class="document-name">{{ documentName }}</span>
                    <div class="document-meta">
                      <span class="document-size">{{ (documentData.fileSize / 1024 / 1024).toFixed(2) }} MB</span>
                      <span class="document-date">{{ formatDate(documentData.uploadedAt) }}</span>
                    </div>
                  </div>
                </div>
                <div class="document-actions">
                  <button 
                    @click="downloadDocument(String(documentName), documentData)"
                    class="download-button"
                  >
                    <Download class="button-icon" />
                    Download
                  </button>
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
.service-queue {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.queue-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.queue-description {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
}

.refresh-button {
  padding: 0.75rem 1.5rem;
  background: #ffa242;
  color: #2A525A;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #e6d700;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  text-align: center;
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #ef4444;
}

.error-message {
  font-size: 1.125rem;
  color: #dc2626;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #ffa242;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

/* No Claims State */
.no-claims-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  text-align: center;
}

.no-claims-icon {
  width: 3rem;
  height: 3rem;
  color: #10b981;
}

.no-claims-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #065f46;
  margin: 0;
}

.no-claims-message {
  font-size: 1.125rem;
  color: #059669;
  margin: 0;
}

/* Claims Grid */
.claims-container {
  margin-top: 2rem;
}

.claims-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.claim-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.claim-card:hover {
  border-color: #ffa242;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.claim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.claim-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
}

.claim-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #ffa242;
}

.claim-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.claim-details {
  margin-bottom: 1rem;
}

.claim-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.info-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}

.claim-progress {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #ffa242;
  transition: width 0.3s ease;
}

.progress-details {
  font-size: 0.75rem;
  color: #6b7280;
}

.claim-actions {
  display: flex;
  justify-content: flex-end;
}

.view-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2A525A;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-button:hover {
  background: #1e3a40;
}

.button-icon {
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 800px;
  width: 100%;
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

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-button {
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.details-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

/* Documents List */
.no-documents {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
}

.no-documents-icon {
  width: 2rem;
  height: 2rem;
  color: #9ca3af;
}

.no-documents-message {
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
  background: #f8fafc;
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

.document-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.download-button:hover {
  background: #059669;
}

/* Responsive Design */
@media (max-width: 768px) {
  .service-queue {
    padding: 1rem;
  }
  
  .queue-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .claims-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
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
}
</style>
