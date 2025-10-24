<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
//import { useManagementStore } from '../stores/management'
import { 
  Shield, 
  BarChart3, 
  FileText, 
  X, 
  Settings, 
  ClipboardList, 
  CreditCard, 
  LogOut, 
  Menu,
  User,
  TrendingUp
} from 'lucide-vue-next'
import { roles } from '../Mixins/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

const allNavigationItems = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: BarChart3 
  },
  { 
    name: 'Policy Creation', 
    path: '/dashboard/policy-creation', 
    icon: FileText 
  },
  { 
    name: 'Cancelation', 
    path: '/dashboard/cancelation', 
    icon: X 
  },
  { 
    name: 'Policy Management', 
    path: '/dashboard/policy-management', 
    icon: ClipboardList 
  },
  { 
    name: 'Claims', 
    path: '/dashboard/claims', 
    icon: CreditCard 
  },
  { 
    name: 'Reports', 
    path: '/dashboard/reports', 
    icon: TrendingUp 
  },
  { 
    name: 'Administration', 
    path: '/dashboard/administration', 
    icon: Settings,
    requiresRole: [2,3,4,12]
  },
  { 
    name: 'Administration2', 
    path: '/dashboard/administration2', 
    icon: Settings,
    requiresRole: [12]
  },
  { 
    name: 'Service Queue', 
    path: '/dashboard/service-queue', 
    icon: Settings,
    requiresRole: [12]
  }
]

// Filter navigation items based on user role
const navigationItems = computed(() => {
  return allNavigationItems.filter(item => {
    // If no role requirement, show to everyone
    if (!item.requiresRole) {
      return true
    }
    
    // Check if user has required role
    const hasRole = authStore.user?.roles && authStore.user.roles.some((role: any) => item.requiresRole.includes(Number(role)))
    return hasRole
  })
})

const isActiveRoute = (path: string) => {
  return route.path === path
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const userRole = computed(() => {
  if (!authStore.user?.roles) return 'No role'
  const roleNumber = Number(authStore.user.roles[authStore.user.roles.length - 1])
  return (roles as any)[roleNumber] || 'Unknown role'
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="authStore.isInitializing || !authStore.isInitialized" class="loading-overlay"><div style="color: black;">{{authStore.isInitializing}} {{!authStore.isInitialized}}</div>
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  </div>

  <div v-else class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <Shield class="logo-icon" />
          <span class="logo-text">P.A.C.E</span>
        </div>
        <button class="sidebar-close" @click="closeSidebar">
          <X class="close-icon" />
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <ul class="nav-list">
            <li v-for="item in navigationItems" :key="item.name" class="nav-item">
              <router-link
                :to="item.path"
                class="nav-link"
                :class="{ 'nav-link-active': isActiveRoute(item.path) }"
                @click="closeSidebar"
              >
                <component :is="item.icon" class="nav-icon" />
                <span class="nav-text">{{ item.name }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <User class="user-icon" />
          </div>
                      <div class="user-details">
              <div class="user-name">{{ authStore.user?.username || 'No username' }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
        </div>
        <button class="logout-button" @click="handleLogout">
          <LogOut class="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <header class="main-header">
        <button class="mobile-menu-button" @click="toggleSidebar">
          <Menu class="menu-icon" />
        </button>
        <h1 class="page-title">{{ navigationItems.find(item => item.path === route.path)?.name || 'Dashboard' }}</h1>
      </header>
      
      <div class="content-area">
        <router-view />
      </div>
    </main>
    
    <!-- Sidebar Overlay -->
    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #ffa242;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: sticky!important;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.sidebar-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.sidebar-close:hover {
  background: #f3f4f6;
}

.close-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #2A525A;
}

.nav-link-active {
  background: #ffa242;
  color: #2A525A;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: capitalize;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.logout-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.main-content {
  flex: 1;
  margin-left: 0;
  display: flex;
  flex-direction: column;
}

.main-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mobile-menu-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.mobile-menu-button:hover {
  background: #f3f4f6;
}

.menu-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6b7280;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.content-area {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

@media (min-width: 1024px) {
  .sidebar {
    position: relative;
    transform: translateX(0);
  }
  
  .sidebar-close {
    display: none;
  }
  
  .mobile-menu-button {
    display: none;
  }
  
  .sidebar-overlay {
    display: none;
  }
  
  .main-content {
    margin-left: 6px;
  }
}
</style>