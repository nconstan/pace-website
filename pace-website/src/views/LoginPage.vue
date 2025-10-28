<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { Shield, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const { login, isLoading, error } = useAuth()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const success = await login({ username: username.value, password: password.value })
    
    if (success) {
      router.push('/dashboard')
    } else {
      errorMessage.value = error.value || 'Invalid username or password'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.'
  }
}

const goToLanding = () => {
  router.push('/')
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo" @click="goToLanding">
          <Shield class="logo-icon" />
          <span class="logo-text">P.A.C.E Insurance</span>
        </div>
      </div>
      
      <div class="login-card">
        <div class="login-content">
          <h1 class="login-title">Agent Portal</h1>
          <p class="login-subtitle">Sign in to access your dashboard</p>
          
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                id="username"
                v-model="username"
                type="text"
                class="form-input"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="password-input-container">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility"
                >
                  <Eye v-if="!showPassword" class="eye-icon" />
                  <EyeOff v-else class="eye-icon" />
                </button>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="forgot-password">
                Forgot Password?
              </button>
            </div>
            
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            
            <button
              type="submit"
              class="login-button"
              :disabled="isLoading"
            >
              <span v-if="isLoading">Signing in...</span>
              <span v-else>Sign In</span>
            </button>
          </form>
        </div>
      </div>
      
      <div class="login-image">
        <img src="https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Insurance Office" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.login-header {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  color: #ffa242;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2A525A;
}

.login-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: white;
}

.login-content {
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  text-align: center;
}

.login-subtitle {
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
}

.login-form {
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

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.eye-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.forgot-password {
  background: none;
  border: none;
  color: #2A525A;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  text-align: center;
  font-size: 0.9rem;
}

.login-button {
  background: #ffa242;
  color: #2A525A;
  border: none;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #e6d700;
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.demo-credentials {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.login-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2A525A;
  position: relative;
  overflow: hidden;
}

.login-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
  }
  
  .login-image {
    display: none;
  }
  
  .login-header {
    position: relative;
    top: auto;
    left: auto;
    padding: 2rem;
    text-align: center;
  }
}
</style>