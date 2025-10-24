import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import PolicyCreation from '../views/PolicyCreation/PolicyCreation.vue'
import Cancelation from '../views/Cancelation.vue'
import PolicyManagement from '../views/PolicyManagement/PolicyManagement.vue'
import Claims from '../views/claims/Claims.vue'
import Administration from '../views/Administration.vue'
import PdfSigner from '../views/pdfSigner.vue'
import PolicyConfirmation from '../views/confirmations/policyConfirmation.vue'
import CancellationConfirmation from '../views/confirmations/cancellationConfirmation.vue'
import Administration2 from '../views/administration2/AdministrationMain.vue'
import SetupPassword from '../views/SetupPassword.vue'
import ReportsMain from '../views/reports/ReportsMain.vue'
import ServiceQueue from '../views/serviceQueue/serviceQueue.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/pdf-signer',
      name: 'pdf-signer',
      component: PdfSigner
    },
    {
      path: '/policy-confirmation',
      name: 'policy-confirmation',
      component: PolicyConfirmation
    },
    {
      path: '/policy-cancellation',
      name: 'policy-cancellation',
      component: CancellationConfirmation
    },
    {
      path: '/setup-password',
      name: 'setup-password',
      component: SetupPassword
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'policy-creation',
          name: 'policy-creation',
          component: PolicyCreation
        },
        {
          path: 'cancelation',
          name: 'cancelation',
          component: Cancelation
        },
        {
          path: 'policy-management',
          name: 'policy-management',
          component: PolicyManagement
        },
        {
          path: 'claims',
          name: 'claims',
          component: Claims
        },
        {
          path: 'administration',
          name: 'administration',
          component: Administration,
          meta: { requiresRole: [4,3,12] }
        },
        {
           path: 'administration2',
           name: 'administration2',
           component: Administration2,
           meta: { requiresRole: [3,2,12] }
         },
         {
           path: 'reports',
           name: 'reports',
           component: ReportsMain,
           meta: { requiresAuth: true }
         },
         {
          path: 'service-queue',
          name: 'service-queue',
          component: ServiceQueue,
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

//SERIOUS TODO: deal with security around this.

router.beforeEach(async (to, __, next) => {
  const authStore = useAuthStore()
  
  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Verify token
    await authStore.validateStoredToken().then((isValid: boolean) => {
      if (!isValid) {
        // Token is invalid, redirect to login
        router.push('/login')
        next(false) // Prevent the current navigation
      }
      else {
        authStore.isInitializing = false
        authStore.isInitialized = true
        console.log("isInitializing", authStore.isInitializing)
        console.log("isInitialized", authStore.isInitialized)
        next()
      }
    })
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // User is already logged in, redirect to dashboard
    next('/dashboard')
  } else {
    // Check for role-based access
    if (to.meta.requiresRole && authStore.isAuthenticated) {
      const requiredRoles = to.meta.requiresRole as number[]
      
      if (!authStore.hasRole(requiredRoles)) {
        // User doesn't have required role, redirect to dashboard
        next('/dashboard')
        return
      }
    }
    
    // No auth required or user is authenticated and has proper role, allow access
    next()
  }
})

export default router


// const { isAuthenticated, validateStoredToken, user } = useAuth()
  
//   // If route requires auth and user is not authenticated
//   if (to.meta.requiresAuth && !isAuthenticated.value) {
//     // Check if there's a stored token and try to validate it
//     const isValid = await validateStoredToken()
    
//     if (isValid) {
//       // Token is valid, allow access
//       next()
//     } else {
//       // No valid token, redirect to login
//       next('/login')
//     }
//   } else if (to.path === '/login' && isAuthenticated.value) {
//     // User is already logged in, redirect to dashboard
//     next('/dashboard')
//   } else {
//     // Check for role-based access
//     if (to.meta.requiresRole && isAuthenticated.value) {
//       const userRole = user.value?.roles
//       const requiredRoles = to.meta.requiresRole as string[]
      
//       if (!userRole || !requiredRoles.includes(userRole[0])) {
//         // User doesn't have required role, redirect to dashboard
//         next('/dashboard')
//         return
//       }
//     }
    
//     // No auth required or user is authenticated and has proper role, allow access
//     next()
//   }