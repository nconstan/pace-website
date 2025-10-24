<template>
  <!-- Loading State -->
  <div v-if="authStore.isInitializing || !authStore.isInitialized" class="loading-state">
    <div class="loading-spinner"></div>
    <p>Loading administration...</p>
  </div>

  <div v-else class="administration">
    <div class="admin-header">
      <h1 class="admin-title">Administration</h1>
      <p class="admin-description">Manage your organization's structure and users</p>
    </div>

    <!-- Role-based Tab Navigation -->
    <div class="tab-navigation">
      <button
        v-for="tab in availableTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ 'tab-active': activeTab === tab.id }"
      >
        <component :is="tab.icon" class="tab-icon" />
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Dealer Group Management -->
      <DealerGroupManagement 
        v-if="activeTab === 'dealer-group'"
        :user-role="userRole"
      />

      <!-- Dealership Management -->
      <DealershipManagement 
        v-if="activeTab === 'dealership'"
        :user-role="userRole"
      />

      <!-- Account Management -->
      <AccountManagement 
        v-if="activeTab === 'account'"
        :user-role="userRole"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Building, Users, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import DealerGroupManagement from './administration/DealerGroupManagement.vue'
import DealershipManagement from './administration/DealershipManagement.vue'
import AccountManagement from './administration/AccountManagement.vue'

const icons = { Building, Users, User }
void icons

const authStore = useAuthStore()
const activeTab = ref('dealer-group')

// Get user's highest role
const userRole = computed(() => {
  if (!authStore.user?.roles || authStore.user.roles.length === 0) return 0
  return Math.max(...authStore.user.roles.map((role: any) => Number(role)))
})

// Define available tabs based on user role
const availableTabs = computed(() => {
  const tabs = []

  // Role 4: MGA Admin - can see all tabs
  if ([4,3,12].includes(userRole.value)) {
    tabs.push(
      { id: 'account', name: 'Account Management', icon: Users },
      { id: 'dealership', name: 'Dealership Management', icon: Building },
      { id: 'dealer-group', name: 'Dealer Group Management', icon: Building }
    )
  }
  // Role 3: Account Group Admin - can see dealership and account management
  else if ([3,2,12].includes(userRole.value)) {
    tabs.push(
      { id: 'account', name: 'Account Management', icon: Users },
      { id: 'dealership', name: 'My Dealership Management', icon: Building }
    )
  }
  // Role 2: Account Admin - can only see account management
  else if ([2,12].includes(userRole.value)) {
    tabs.push(
      { id: 'account', name: 'Account Management', icon: Users }
    )
  }
  console.log(userRole, tabs)
  return tabs
})

// Set default tab based on available tabs
onMounted(() => {
  // User data is already loaded by DashboardLayout
  if (availableTabs.value.length > 0) {
    activeTab.value = availableTabs.value[0]?.id || ''
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.administration {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.admin-header {
  text-align: center;
  margin-bottom: 1rem;
}

.admin-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.admin-description {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  border-color: #2A525A;
  color: #2A525A;
}

.tab-active {
  border-color: #2A525A;
  background: #ffa242;
  color: #2A525A;
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.tab-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
  }
  
  .tab-button {
    justify-content: center;
  }
}
</style>