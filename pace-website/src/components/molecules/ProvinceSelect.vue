<template>
  <div class="form-group">
    <label :for="id" class="form-label">{{ label }}</label>
    <select
      :id="id"
      :value="modelValue"
      @input="handleInput"
      class="form-input"
      :class="{ 'error': hasError }"
      @blur="$emit('blur')"
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
    <div v-if="hasError && errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ProvinceSelect'
}
</script>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  id?: string
  hasError?: boolean
  errorMessage?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Province *',
  placeholder: 'Select Province',
  id: 'province',
  hasError: false,
  errorMessage: ''
})

const emit = defineEmits<Emits>()

// Use props to avoid unused variable warning
const { label, id, hasError, errorMessage } = props

const handleInput = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
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
  font-family: inherit;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #2A525A;
}

.form-input.error {
  border-color: #ef4444;
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}
</style>