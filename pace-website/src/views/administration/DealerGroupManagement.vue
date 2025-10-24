<template>
  <div class="dealer-group-management">
    <div class="section-header">
      <h2 class="section-title">Dealer Group Management</h2>
      <button 
        v-if="userRole >= 4" 
        @click="openCreateModal" 
        class="btn btn-primary"
      >
        <Plus class="btn-icon" />
        Create Dealer Group
      </button>
    </div>

    <!-- Content -->
    <div class="content-section">
      <!-- Role 3: Single Dealer Group View -->
      <div v-if="userRole === 3">
        <!-- Dealer Group Information -->
        <div v-if="currentDealerGroup" class="group-info-section">
          <div class="info-card">
            <h3 class="info-title">Group Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">Group Name</label>
                <span class="info-value">{{ currentDealerGroup.name }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Dealer Margin</label>
                <span class="info-value">{{ currentDealerGroup.dealer_margin }}%</span>
              </div>
              <div class="info-item">
                <label class="info-label">Group Split</label>
                <span class="info-value">{{ currentDealerGroup.dealer_group_split }}%</span>
              </div>
              <div class="info-item">
                <label class="info-label">Referral Fee Rate</label>
                <span class="info-value">{{ currentDealerGroup.referral_fee_rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Associated Dealerships -->
        <div v-if="currentDealerGroup?.dealerships?.length" class="dealerships-section">
          <h3 class="section-subtitle">Associated Dealerships</h3>
          <div class="dealerships-grid">
            <div 
              v-for="dealership in currentDealerGroup.dealerships" 
              :key="dealership.id"
              class="dealership-card"
            >
              <div class="dealership-header">
                <h4 class="dealership-name">{{ dealership.name }}</h4>
                <span class="dealership-province">{{ dealership.province }}</span>
              </div>
              <div class="dealership-details">
                <p class="dealership-address">{{ dealership.address }}</p>
                <p class="dealership-contact">{{ dealership.phone }} • {{ dealership.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State for Role 3 -->
        <div v-else-if="!currentDealerGroup" class="empty-state">
          <div class="empty-icon">
            <Building class="icon" />
          </div>
          <h3 class="empty-title">No Dealer Group Found</h3>
          <p class="empty-description">
            Contact your administrator to set up a dealer group.
          </p>
        </div>
      </div>

             <!-- Roles 4 and 12: All Dealer Groups List View -->
       <div v-else-if="userRole >= 4" class="all-groups-section">
         <div class="groups-list">
           <div 
             v-for="group in managementStore.dealerGroups" 
             :key="group.id"
             class="group-card"
           >
             <div class="group-header">
               <h3 class="group-name">{{ group.name || `Dealer Group ${group.id}` }}</h3>
               <button 
                 @click="editGroup(group)"
                 class="btn btn-secondary btn-sm"
               >
                 <Edit class="btn-icon" />
                 Edit
               </button>
             </div>
             <div class="group-details">
               <div class="detail-item">
                 <span class="detail-label">Dealer Margin:</span>
                 <span class="detail-value">{{ group.dealer_margin || 0 }}%</span>
               </div>
               <div class="detail-item">
                 <span class="detail-label">Group Split:</span>
                 <span class="detail-value">{{ group.dealer_group_split || 0 }}%</span>
               </div>
               <div class="detail-item">
                 <span class="detail-label">Referral Fee Rate:</span>
                 <span class="detail-value">{{ group.referral_fee_rate || 0 }}%</span>
               </div>
               <div class="detail-item">
                 <span class="detail-label">Dealerships:</span>
                 <span class="detail-value">{{ group.dealerships?.length || 0 }}</span>
               </div>
             </div>
           </div>
           
           <!-- Empty state for roles 4 and 12 -->
           <div v-if="managementStore.dealerGroups.length === 0" class="empty-state">
             <div class="empty-icon">
               <Building class="icon" />
             </div>
             <h3 class="empty-title">No Dealer Groups Found</h3>
             <p class="empty-description">
               Create your first dealer group to get started.
             </p>
           </div>
         </div>
       </div>
      
      <!-- Fallback for any other role or no content -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <Building class="icon" />
        </div>
        <h3 class="empty-title">No Content Available</h3>
        <p class="empty-description">
          No dealer group content is available for your role ({{ userRole }}).
        </p>
      </div>
    </div>

    <!-- Create/Edit Dealer Group Modal -->
    <DealerGroupModal
      v-if="showModal"
      :is-editing="isEditing"
      :dealer-group="selectedDealerGroup"
      :user-role="userRole"
      @close="showModal = false"
      @save="handleSave"
    />
  </div>
</template>


<script lang="ts">
export default {
  name: 'DealerGroupManagement'
}
</script>

<script setup lang="ts">
import { ref, onMounted,} from 'vue'
import { Plus, Edit, Building } from 'lucide-vue-next'
import { useManagementStore } from '../../stores/management'
import DealerGroupModal from './modals/DealerGroupModal.vue'
import adminService from '../../services/admin.service'

interface Props {
  userRole: number
}

const props = defineProps<Props>()
void props
const managementStore = useManagementStore()

const showModal = ref(false)
const isEditing = ref(false)
const currentDealerGroup = ref<any>(null)
const selectedDealerGroup = ref<any>(null)

// Edit a specific dealer group
const editGroup = (group: any) => {
  selectedDealerGroup.value = group
  openEditModal()
}

// Set current dealer group from store data
const setCurrentDealerGroup = () => {
  if (managementStore.dealerGroups.length > 0) {
    currentDealerGroup.value = managementStore.dealerGroups[0]
  }
}

const openCreateModal = () => {
  isEditing.value = false
  selectedDealerGroup.value = null
  showModal.value = true
}

const openEditModal = () => {
  isEditing.value = true
  showModal.value = true
}

const handleSave = async (data: any) => {
  try {
    if (isEditing.value) {
      await managementStore.updateDealerGroup(selectedDealerGroup.value.id, data)
    } else {
      await adminService.createDealerGroup(data)
    }
    // Refresh the store data after saving
    await managementStore.refreshDealerGroups()
    setCurrentDealerGroup()
    showModal.value = false
  } catch (error) {
    console.error('Error saving dealer group:', error)
  }
}

onMounted(async () => {
  // Data is already loaded by the DashboardLayout initialization
  setCurrentDealerGroup()
  console.log("dealer groups", managementStore.dealerGroups)
  managementStore.refreshDealerGroups()
})
</script>

<style scoped>
.dealer-group-management {
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #ffa242;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.group-info-section {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-card {
  padding: 2rem;
}

.info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.info-actions {
  display: flex;
  gap: 1rem;
}

.dealerships-section {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.dealerships-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.dealership-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.dealership-card:hover {
  border-color: #2A525A;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dealership-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.dealership-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dealership-province {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.dealership-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dealership-address {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.dealership-contact {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-icon .icon {
  width: 2rem;
  height: 2rem;
  color: #9ca3af;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
  max-width: 400px;
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

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.all-groups-section {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  background: #fafafa;
}

.group-card:hover {
  border-color: #2A525A;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: white;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.group-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .dealerships-grid {
    grid-template-columns: 1fr;
  }
  
  .info-actions {
    flex-direction: column;
  }
}
</style>
