<script setup lang="ts">
import { ref } from 'vue'

const randomNumber = ref<number | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const fetchRandomNumber = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/random')
    const data = await response.json()
    console.log(data)
    if (data.success) {
      randomNumber.value = data.randomNumber
    } else {
      error.value = 'Failed to get random number'
    }
  } catch (err) {
    error.value = 'Network error: ' + (err as Error).message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <h1>PACE Insurance</h1>
    <p>Welcome to PACE Insurance - Your trusted insurance partner</p>
    
    <div class="api-demo">
      <h2>API Demo</h2>
      <button 
        @click="fetchRandomNumber" 
        :disabled="isLoading"
        class="random-btn"
      >
        {{ isLoading ? 'Loading...' : 'Get Random Number' }}
      </button>
      
      <div v-if="randomNumber !== null" class="result">
        <h3>Random Number: {{ randomNumber }}</h3>
      </div>
      
      <div v-if="error" class="error">
        <p>Error: {{ error }}</p>
      </div>
    </div>
    
    <p>
      Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
      documentation
    </p>
  </div>
</template>

<style scoped>
.api-demo {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.random-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin: 10px 0;
}

.random-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.random-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.result {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.error {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}

h1 {
  color: #2c3e50;
}

h2 {
  color: #34495e;
  margin-bottom: 1rem;
}

h3 {
  color: #27ae60;
  margin: 0;
}
</style>
