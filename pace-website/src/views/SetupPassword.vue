<template>
  <div class="setup-password">
    <div class="setup-container">
      <div class="setup-card">
        <div class="setup-header">
          <h1 class="setup-title">Set Up Your Password</h1>
          <p class="setup-subtitle">Complete your account registration</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="setup-form">
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              :class="{ 'error': passwordError }"
              placeholder="Enter your password"
              @input="validatePassword"
              @blur="validatePassword"
              required
            />
            <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              :class="{ 'error': confirmPasswordError }"
              placeholder="Confirm your password"
              @input="validateConfirmPassword"
              @blur="validateConfirmPassword"
              required
            />
            <div v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</div>
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'Setting up...' : 'Set Password' }}
          </button>
        </form>
        
        <div v-if="error" class="error-alert">
          {{ error }}
        </div>
        
        <div v-if="success" class="success-alert">
          {{ success }}
          <router-link to="/login" class="login-link">Go to Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authService from '../services/auth.service'

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const token = ref('')

const passwordError = ref('')
const confirmPasswordError = ref('')

const isFormValid = computed(() => {
  return password.value.length >= 8 && 
         password.value === confirmPassword.value && 
         !passwordError.value && 
         !confirmPasswordError.value
})

const validatePassword = () => {
  passwordError.value = ''
  
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long'
  } else if (!/(?=.*[a-z])/.test(password.value)) {
    passwordError.value = 'Password must contain at least one lowercase letter'
  } else if (!/(?=.*[A-Z])/.test(password.value)) {
    passwordError.value = 'Password must contain at least one uppercase letter'
  } else if (!/(?=.*\d)/.test(password.value)) {
    passwordError.value = 'Password must contain at least one number'
  }
}

const validateConfirmPassword = () => {
  confirmPasswordError.value = ''
  
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    await authService.setupPassword(token.value, password.value)
    success.value = 'Password set successfully! You can now log in to your account.'
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
    
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to set password. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Get token from URL query parameter
  const urlToken = route.query.token as string
  if (!urlToken) {
    error.value = 'Invalid setup link. Please contact your administrator.'
    return
  }
  
  token.value = urlToken
})
</script>

<style scoped>
.setup-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2A525A 0%, #1f2937 100%);
  padding: 2rem;
}

.setup-container {
  width: 100%;
  max-width: 400px;
}

.setup-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.setup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.setup-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.setup-subtitle {
  color: #6b7280;
  margin: 0;
}

.setup-form {
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

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2A525A;
}

.form-input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: #ffa242;
  color: #2A525A;
}

.btn-primary:hover:not(:disabled) {
  background: #e6d700;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  text-align: center;
}

.success-alert {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  text-align: center;
}

.login-link {
  display: block;
  margin-top: 0.5rem;
  color: #ffa242;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .setup-password {
    padding: 1rem;
  }
  
  .setup-card {
    padding: 1.5rem;
  }
  
  .setup-title {
    font-size: 1.5rem;
  }
}
</style>
