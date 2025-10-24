<template>
  <div class="policy-confirmation">
    <div class="container">
      <div class="card">
        <div class="card-header">
          <h1>Policy Confirmation</h1>
        </div>
        
        <div class="card-body">
          <!-- Loading State -->
          <div v-if="loading" class="loading-section">
            <div class="loading-spinner"></div>
            <p>Confirming your policy...</p>
          </div>
          
          <!-- Success State -->
          <div v-else-if="success" class="success-section">
            <div class="success-icon">✅</div>
            <h2>Policy Confirmed Successfully!</h2>
            <p>Your policy has been confirmed and is now active.</p>
            <button @click="goToDashboard" class="btn btn-primary">Go to Dashboard</button>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="error-section">
            <div class="error-icon">❌</div>
            <h2>Confirmation Failed</h2>
            <p>{{ errorMessage }}</p>
            <button @click="retryConfirmation" class="btn btn-secondary">Try Again</button>
            <button @click="goToDashboard" class="btn btn-primary">Go to Dashboard</button>
          </div>
          
          <!-- Initial State -->
          <div v-else class="initial-section">
            <div class="info-icon">ℹ️</div>
            <h2>Confirming Policy</h2>
            <p>Please wait while we confirm your policy...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import policyService from '../../services/policy.service'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

// Get token from URL parameters
const token = route.query.token as string

const confirmPolicy = async () => {
  if (!token) {
    error.value = true
    errorMessage.value = 'No confirmation token provided'
    return
  }

  loading.value = true
  error.value = false
  success.value = false

  try {
    await policyService.confirmPolicy(token)
    success.value = true
  } catch (err: any) {
    error.value = true
    errorMessage.value = err.response?.data?.message || 'An error occurred during confirmation'
  } finally {
    loading.value = false
  }
}

const retryConfirmation = () => {
  confirmPolicy()
}

const goToDashboard = () => {
  router.push('/dashboard')
}

// Start confirmation process when component mounts
onMounted(() => {
  confirmPolicy()
})
</script>

<style scoped>
.policy-confirmation {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 500px;
  width: 100%;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.card-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.card-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.card-body {
  padding: 40px;
  text-align: center;
}

.loading-section,
.success-section,
.error-section,
.initial-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon,
.error-icon,
.info-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.success-section h2 {
  color: #28a745;
  margin: 0;
  font-size: 24px;
}

.error-section h2 {
  color: #dc3545;
  margin: 0;
  font-size: 24px;
}

.initial-section h2 {
  color: #007bff;
  margin: 0;
  font-size: 24px;
}

p {
  color: #666;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  margin: 5px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

@media (max-width: 600px) {
  .card-body {
    padding: 30px 20px;
  }
  
  .card-header h1 {
    font-size: 20px;
  }
  
  .success-section h2,
  .error-section h2,
  .initial-section h2 {
    font-size: 20px;
  }
}
</style>
