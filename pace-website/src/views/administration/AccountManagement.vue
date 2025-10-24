<template>
  <div class="account-management">
    <div class="section-header">
      <h2 class="section-title">Account Management</h2>
      <button 
        v-if="userRole >= 2" 
        @click="openCreateModal" 
        class="btn btn-primary"
      >
        <Plus class="btn-icon" />
        Create Account
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
            placeholder="Search accounts by name, email, phone, or dealership..."
            class="search-input"
          />
        </div>
        <div class="filter-controls">
          <select v-model="selectedRole" class="filter-select">
            <option value="">All Roles</option>
            <option value="1"> Facilitators </option>
            <option value="2"> Dealership Admin </option>
            <option value="3"> Dealer Group Admin </option>
            <option value="4"> Internal </option>
          </select>
          <select v-model="selectedDealership" class="filter-select">
            <option value="">All Dealerships</option>
            <option 
              v-for="dealership in dealerships" 
              :key="dealership.id" 
              :value="dealership.id"
            >
              {{ dealership.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading accounts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadData" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Accounts Table -->
    <div v-else class="table-container">
      <table class="accounts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Dealerships</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in filteredAccounts" :key="account.id" class="account-row">
            <td>
              <div class="account-name">
                <span class="full-name">{{ getAccountFullName(account) }}</span>
              </div>
            </td>
            <td>
              <div class="email-info">
                <div class="primary-email">{{ account.contact?.primary_email || 'N/A' }}</div>
              </div>
            </td>
            <td>
              <div class="phone-info">
                <div class="primary-phone">{{ account.contact?.primary_phone_number || 'N/A' }}</div>
              </div>
            </td>
            <td>
              <div class="roles-container">
                <span
                  v-for="roleId in account.roles || []"
                  :key="roleId"
                  class="role-badge"
                  :class="getRoleClass(roleId)"
                >
                  {{ getRoleName(roleId) }}
                </span>
              </div>
            </td>
            <td>
              <div class="dealerships-list">
                {{ getDealershipNames(account.dealerships || []) }}
              </div>
            </td>
            <td>
              <span class="status-badge" :class="account.active ? 'active' : 'inactive'">
                {{ account.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  @click="openEditModal(account)" 
                  class="action-btn edit-btn"
                  title="Edit Account"
                >
                  <Edit class="action-icon" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredAccounts.length === 0 && !isLoading" class="empty-state">
        <p>No accounts found matching your criteria.</p>
      </div>
    </div>

    <!-- Create/Edit Account Modal -->
    <AccountModal
      v-if="showModal"
      :is-editing="isEditing"
      :account="currentAccount"
      :user-role="userRole"
      :dealerships="dealerships"
      @close="showModal = false"
      @save="handleSave"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'AccountManagement'
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Edit, Trash2 } from 'lucide-vue-next'
import { useManagementStore } from '../../stores/management'
import adminService from '../../services/admin.service'
import AccountModal from './modals/AccountModal.vue'
import { roles } from '../../Mixins/constants'

const icons = { Plus, Search, Edit, Trash2 }
void icons

interface Props {
  userRole: number
}

const props = defineProps<Props>()
void props
const managementStore = useManagementStore()

const showModal = ref(false)
const isEditing = ref(false)
const currentAccount = ref<any>(null)
const searchTerm = ref('')
const selectedRole = ref('')
const selectedDealership = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const dealerships = computed(() => managementStore.dealerships)

// Filter accounts based on search and filters
const filteredAccounts = computed(() => {
  let accounts = managementStore.accounts
  console.log("accounts", accounts)
  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    accounts = accounts.filter(account => 
      getAccountFullName(account).toLowerCase().includes(search) ||
      account.contact?.primary_email?.toLowerCase().includes(search) ||
      account.username?.toLowerCase().includes(search) ||
      account.contact?.primary_phone_number?.toLowerCase().includes(search) ||
      account.contact?.secondary_phone_number?.toLowerCase().includes(search) ||
      account.contact?.secondary_email?.toLowerCase().includes(search) ||
      account.dealerships?.some((accountDealership:any) => accountDealership.name.toLowerCase().includes(search)) ||
      account.dealer_group?.name.toLowerCase().includes(search)
    )
  }

  // Apply role filter
  if (selectedRole.value) {
    if(selectedRole.value === '4'){
      accounts = accounts.filter(account => 
        !account.roles.some((role:number) => [1,2,3].includes(role))
      )
    }
    else{
      accounts = accounts.filter(account => 
        account.roles.includes(parseInt(selectedRole.value))
      )
    }
  }

  // Apply dealership filter
  if (selectedDealership.value) {
    accounts = accounts.filter(account => 
      account.dealerships?.includes(selectedDealership.value)
    )
  }

  return accounts
})

const getAccountFullName = (account: any) => {
  if (account.contact?.first_name && account.contact?.last_name) {
    return `${account.contact.first_name} ${account.contact.last_name}`
  }
  return account.username || 'Unknown'
}

const getDealershipNames = (accountDealerships: any[]) => {
  if (!accountDealerships || accountDealerships.length === 0) {
    return 'None'
  }
  
  // Handle both old format (array of IDs) and new format (array of objects)
  if (typeof accountDealerships[0] === 'string') {
    // Old format: array of dealership IDs
    return accountDealerships
      .map(id => dealerships.value.find((d: any) => d.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'None'
  } else {
    // New format: array of dealership objects with id, name, nickname
    return accountDealerships
      .map((dealership: any) => dealership.name || dealership.nickname)
      .filter(Boolean)
      .join(', ') || 'None'
  }
}

// const formatPhone = (phone: string) => {
//   if (!phone) return ''
//   // Basic phone formatting - you can enhance this
//   return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
// }

const getRoleName = (roleId: number) => {
  return roles[roleId as keyof typeof roles] || 'Unknown'
}

const getRoleClass = (roleId: number) => {
  switch (roleId) {
    case 1: return 'role-account'
    case 2: return 'role-manager'
    case 3: return 'role-gmanager'
    default: return 'role-unknown'
  }
}

const openCreateModal = () => {
  isEditing.value = false
  currentAccount.value = null
  showModal.value = true
}

const openEditModal = (account: any) => {
  isEditing.value = true
  currentAccount.value = { ...account }
  showModal.value = true
}

const handleSave = async (data: any) => {
  isLoading.value = true
  error.value = null
  
  try {
    if (isEditing.value) {
      const updatedAccount = await adminService.updateAccount(currentAccount.value.id, data)
      managementStore.updateAccount(currentAccount.value.id, updatedAccount)
    } else {
      const newAccount = await adminService.createAccount(data)
      managementStore.addAccount(newAccount)
    }
    showModal.value = false
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save account'
  } finally {
    isLoading.value = false
  }
}

const loadData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    await Promise.all([
      managementStore.initializeDealerships(),
      managementStore.initializeAccounts()
    ])
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.account-management {
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

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #2A525A;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: black;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #ffa242;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.table-container {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
}

.accounts-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.accounts-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.account-row:hover {
  background: #f9fafb;
}

.account-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.full-name {
  font-weight: 600;
  color: #1f2937;
}

.nickname {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.email-info, .phone-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.primary-email, .primary-phone {
  font-weight: 500;
  color: #1f2937;
}

.secondary-email, .secondary-phone {
  font-size: 0.875rem;
  color: #6b7280;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-account {
  background: #dbeafe;
  color: #1e40af;
}

.role-manager {
  background: #fef3c7;
  color: #d97706;
}

.role-gmanager {
  background: #fce7f3;
  color: #be185d;
}

.role-unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.dealerships-list {
  font-size: 0.875rem;
  color: #374151;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.edit-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fecaca;
}

.action-icon {
  width: 1rem;
  height: 1rem;
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
  
  .filter-controls {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }

  .accounts-table {
    font-size: 0.875rem;
  }

  .accounts-table th,
  .accounts-table td {
    padding: 0.75rem 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
