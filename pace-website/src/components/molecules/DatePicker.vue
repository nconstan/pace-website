<template>
  <div class="form-group">
    <label :for="id" class="form-label">{{ label }}</label>
    <div class="date-input-container">
      <input
        :id="id"
        :value="displayValue"
        @focus="showCalendar = true"
        class="form-input date-input"
        :class="{ 'error': hasError }"
        :placeholder="placeholder"
        readonly
      />
      <button
        type="button"
        @click="toggleCalendar"
        class="calendar-button"
        :class="{ 'active': showCalendar }"
      >
        <Calendar class="calendar-icon" />
      </button>
    </div>
    
    <!-- Native Date Input Dropdown -->
    <div v-if="showCalendar" class="calendar-dropdown" :class="calendarPosition">
      <input
        type="date"
        :value="props.modelValue"
        :min="minDate?.toISOString().split('T')[0]"
        :max="maxDate?.toISOString().split('T')[0]"
        @change="handleDateChange"
        class="native-date-input"
      />
    </div>
    
    <div v-if="hasError && errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'DatePicker'
}
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Calendar } from 'lucide-vue-next'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  id?: string
  hasError?: boolean
  errorMessage?: string
  minDate?: Date
  maxDate?: Date
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Date *',
  placeholder: 'Select date',
  id: 'date',
  hasError: false,
  errorMessage: '',
  minDate: () => new Date(1900, 0, 1),
  maxDate: () => new Date()
})

const emit = defineEmits<Emits>()

// Calendar state
const showCalendar = ref(false)
const selectedDate = ref<Date | null>(props.modelValue ? new Date(props.modelValue) : null)
const calendarPosition = ref<'bottom' | 'top'>('bottom')

// Check if calendar would overflow modal
const checkCalendarPosition = () => {
  const inputElement = document.getElementById(props.id)
  if (!inputElement) return
  
  const rect = inputElement.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const calendarHeight = 300 // Approximate calendar height
  
  // Check if calendar would overflow bottom of viewport
  if (rect.bottom + calendarHeight > viewportHeight) {
    calendarPosition.value = 'top'
  } else {
    calendarPosition.value = 'bottom'
  }
}

// Get the date to show when opening calendar
const getCalendarDefaultDate = () => {
  if (props.modelValue) {
    return new Date(props.modelValue)
  }
  return new Date(2000, 0, 1)
}

// Computed values
const displayValue = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

const toggleCalendar = () => {
  if (!showCalendar.value) {
    checkCalendarPosition()
  }
  showCalendar.value = !showCalendar.value
}

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    selectedDate.value = new Date(target.value)
    emit('update:modelValue', target.value)
    showCalendar.value = false
  }
}

// Click outside to close
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.date-input-container') && !target.closest('.calendar-dropdown')) {
    showCalendar.value = false
  }
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = new Date(newValue)
  } else {
    selectedDate.value = null
  }
})

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.date-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input {
  padding: 0.75rem;
  padding-right: 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
  background-color: white;
  width: 100%;
  cursor: pointer;
}

.date-input:focus {
  outline: none;
  border-color: #2A525A;
}

.date-input.error {
  border-color: #ef4444;
}

.calendar-button {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  color: #6b7280;
}

.calendar-button:hover {
  background: #f3f4f6;
}

.calendar-button.active {
  background: #ffa242;
  color: #2A525A;
}

.calendar-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.calendar-dropdown {
  position: absolute;
  right: 0;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 1rem;
}

.calendar-dropdown.bottom {
  top: 100%;
  margin-top: 0.25rem;
}

.calendar-dropdown.top {
  bottom: 100%;
  margin-bottom: 0.25rem;
}

.native-date-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}
</style>
