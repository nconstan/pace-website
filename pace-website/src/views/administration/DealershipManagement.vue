<template>
  <div class="dealership-management">
    <div class="section-header">
      <h2 class="section-title">Dealership Management</h2>
      <button 
        v-if="userRole >= 3" 
        @click="openCreateModal" 
        class="btn btn-primary"
      >
        <Plus class="btn-icon" />
        Create Dealership
      </button>
    </div>

    <!-- Search and Filter Section -->
    <div class="search-section">
      <div class="search-controls">
        <div class="search-input-group">
          <Search class="search-icon" />
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="`${userRole > 2 ? 'Search dealerships by name, or by dealer group name...' : 'Search dealerships by name...'}`"
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <div class="filter-controls">
          <select v-model="selectedProvince" class="filter-select" @change="handleFilter">
            <option value="">All Provinces</option>
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
        </div>
      </div>
    </div>

    <!-- Dealerships List -->
    <div class="dealerships-list">
      <div 
        v-for="dealership in filteredDealerships" 
        :key="dealership.id"
        class="dealership-card"
      >
        <div class="dealership-info">
          <h3 class="dealership-name">{{ dealership.name || 'Unnamed Dealership' }}</h3>
          <div class="dealership-details">
            <span class="detail-item">
              <strong>Province:</strong> {{ dealership.province || 'N/A' }}
            </span>
            <span class="detail-item">
              <strong>Address:</strong> {{ dealership.address || 'N/A' }}
            </span>
            <span class="detail-item">
              <strong>Phone:</strong> {{ dealership.phone || 'N/A' }}
            </span>
            <span class="detail-item">
              <strong>Email:</strong> {{ dealership.email || 'N/A' }}
            </span>
            <span class="detail-item">
              <strong>Manager:</strong> {{ dealership.manager || 'N/A' }}
            </span>
          </div>
        </div>
        <div class="dealership-actions">
          <button 
            @click="openEditModal(dealership)"
            class="btn btn-secondary btn-sm"
          >
            <Edit class="btn-icon" />
            Edit
          </button>
          <button 
            @click="deleteDealership(dealership.id)"
            class="btn btn-danger btn-sm"
          >
            <Trash2 class="btn-icon" />
            Delete
          </button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredDealerships.length === 0" class="empty-state">
        <p>No dealerships found matching your criteria.</p>
      </div>
    </div>

    <!-- Create/Edit Dealership Modal -->
    <DealershipModal
      v-if="showModal"
      :is-editing="isEditing"
      :dealership="currentDealership"
      :user-role="userRole"
      @close="showModal = false"
      @save="handleSave"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'DealershipManagement'
}
</script>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Edit, Trash2 } from 'lucide-vue-next'
import { useManagementStore } from '../../stores/management'
import adminService from '../../services/admin.service'
import DealershipModal from './modals/DealershipModal.vue'

interface Props {
  userRole: number
}

const props = defineProps<Props>()
const managementStore = useManagementStore()

const showModal = ref(false)
const isEditing = ref(false)
const currentDealership = ref<any>(null)
const searchTerm = ref('')
const selectedProvince = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed property for filtered dealerships
const filteredDealerships = computed(() => {
  let dealerships = managementStore.dealerships

  // Role 3: Seller Group Admin - only show dealerships in their group
  if (props.userRole === 3) {
    // Filter by user's dealer group (implement when API is available)
    // dealerships = dealerships.filter(d => userDealerGroup.includes(d.id))
  }
  console.log(dealerships)
  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    dealerships = dealerships.filter(d => 
      d.dealer_group.name?.toLowerCase().includes(search) ||
      d.dealer_group.nickname?.toLowerCase().includes(search) ||
      d.name?.toLowerCase().includes(search) ||
      d.province?.toLowerCase().includes(search) ||
      d.address?.toLowerCase().includes(search) ||
      d.phone?.toLowerCase().includes(search) ||
      d.email?.toLowerCase().includes(search) ||
      d.manager?.toLowerCase().includes(search)
    )
  }

  // Apply province filter
  if (selectedProvince.value) {
    dealerships = dealerships.filter(d => d.province === selectedProvince.value)
  }

  return dealerships
})

const handleSearch = () => {
  // Search is handled by the computed property
  // No additional logic needed
}

const handleFilter = () => {
  // Filter is handled by the computed property
  // No additional logic needed
}

const openCreateModal = () => {
  isEditing.value = false
  currentDealership.value = null
  showModal.value = true
}

const openEditModal = (dealership: any) => {
  isEditing.value = true
  currentDealership.value = { ...dealership }
  showModal.value = true
}

const deleteDealership = async (id: string) => {
  if (confirm('Are you sure you want to delete this dealership?')) {
    isLoading.value = true
    error.value = null
    
    try {
      await adminService.deleteDealership(id)
      managementStore.removeDealership(id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete dealership'
    } finally {
      isLoading.value = false
    }
  }
}

const handleSave = async (data: any) => {
  isLoading.value = true
  error.value = null
  
  try {
    if (isEditing.value) {
      const updatedDealership = await adminService.updateDealership(currentDealership.value.id, data)
      managementStore.updateDealership(currentDealership.value.id, updatedDealership)
    } else {
      const newDealership = await adminService.createDealership(data)
      managementStore.addDealership(newDealership)
    }
    showModal.value = false
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save dealership'
  } finally {
    isLoading.value = false
  }
}

const loadDealerships = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    await managementStore.initializeDealerships()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch dealerships'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    await loadDealerships()
  } catch (error) {
    console.error('Error loading dealerships:', error)
  }
})
</script>

<style scoped>
.dealership-management {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.search-section {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input-group {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2A525A;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #2A525A;
}

.dealerships-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dealership-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s;
}

.dealership-card:hover {
  border-color: #2A525A;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dealership-info {
  flex: 1;
}

.dealership-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.dealership-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.detail-item {
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-item strong {
  color: #374151;
}

.dealership-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
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

.btn-primary:hover {
  background: #e6d700;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>
