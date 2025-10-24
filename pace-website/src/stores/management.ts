import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type Dealership, type Account, type DealerGroup } from '../services/admin.service'
import { type Policy } from '../services/policy.service'
import policyService from '../services/policy.service'
import adminService from '../services/admin.service'

export const useManagementStore = defineStore('management', () => {
  // State
  const accounts = ref<Account[]>([])
  const dealerships = ref<Dealership[]>([])
  const dealerGroups = ref<DealerGroup[]>([])
  const policies = ref<Policy[]>([])
  const selectedDealership = ref<Dealership | null>(null)
  
  // Initialization flags
  const policiesInitialized = ref(false)
  const accountsInitialized = ref(false)
  const dealershipsInitialized = ref(false)
  const dealerGroupsInitialized = ref(false)

  // Computed
  const totalAccounts = computed(() => accounts.value.length)
  const totalDealerships = computed(() => dealerships.value.length)
  const totalDealerGroups = computed(() => dealerGroups.value.length)
  const totalPolicies = computed(() => policies.value.length)

  // Initialize policies if not already done
  const initializePolicies = async () => {
    if (!policiesInitialized.value) {
      try {
        // Get policies from the last 30 days for initial data load
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const data = await policyService.getPolicies({
          requestedValues: {
            policies: 'all',
            pricing_details: { seller_commission: true},
            cancelation_details: 'all'
          },
          additionalFilters: {
            policies: {
              created_at: {
                gte: thirtyDaysAgo.toISOString()
              }
            }
          }
        })
        policies.value = data
        policiesInitialized.value = true
        console.log("policies initialized", policies.value)
      } catch (error) {
        console.error('Failed to initialize policies:', error)
      }
    }
  }

  // Initialize accounts if not already done
  const initializeAccounts = async () => {
    if (!accountsInitialized.value) {
      try {
        const data = await adminService.getAccounts()
        accounts.value = data
        accountsInitialized.value = true
      } catch (error) {
        console.error('Failed to initialize accounts:', error)
      }
    }
  }

  // Initialize dealerships if not already done
  const initializeDealerships = async () => {
    if (!dealershipsInitialized.value) {
      try {
        const data = await adminService.getDealerships()
        dealerships.value = data
        dealershipsInitialized.value = true
        selectedDealership.value = dealerships.value[0]
      } catch (error) {
        console.error('Failed to initialize dealerships:', error)
      }
    }
  }

  // Initialize dealer groups if not already done
  const initializeDealerGroups = async () => {
    console.log("ran initialize dealer groups")
    if (!dealerGroupsInitialized.value) {
      try {
        const data = await adminService.getDealerGroups()
        dealerGroups.value = data
        dealerGroupsInitialized.value = true
      } catch (error) {
        console.error('Failed to initialize dealer groups:', error)
        throw error
      }
    }
  }

  // Initialize all data based on user role
  const initializeUserData = async (userRoles: number[]) => {
    try {
      // Always initialize dealer groups for all roles
      //await initializeDealerGroups()
      
      // Initialize dealerships for roles that need them
      if (userRoles.some(role => [1, 2, 3, 4, 12].includes(role))) {
        await initializeDealerships()
      }
      
      // Initialize accounts for admin roles
      // if (userRoles.some(role => [4, 12].includes(role))) {
      //   await initializeAccounts()
      // }
      
      // Initialize policies for all roles
      //await initializePolicies()
    } catch (error) {
      console.error('Failed to initialize user data:', error)
      throw error
    }
  }

  const getInitialData = async () => {
    try {
      initializePolicies()
      initializeDealerships()
      console.log("initial data initialized")
    } catch (error) {
      console.error('Failed to get initial data:', error)
      throw error
    }
  }

  // State setters
  const setAccounts = (accountsData: Account[]) => {
    accounts.value = accountsData
    accountsInitialized.value = true
  }

  const setDealerships = (dealershipsData: Dealership[]) => {
    dealerships.value = dealershipsData
    dealershipsInitialized.value = true
  }

  const setDealerGroups = (dealerGroupsData: DealerGroup[]) => {
    dealerGroups.value = dealerGroupsData
    dealerGroupsInitialized.value = true
  }

  const setPolicies = (policiesData: Policy[]) => {
    policies.value = policiesData
    policiesInitialized.value = true
  }

  // Refresh methods
  const refreshPolicies = async () => {
    try {
      const data = await policyService.getPolicies({
        requestedValues: {
          policies: 'all',
          vehicle_details: 'all',
          applicants: 'all',
          pricing_details: 'all',
          cancelation_details: 'all'
        },
        additionalFilters: {}
      })
      policies.value = data
    } catch (error) {
      console.error('Failed to refresh policies:', error)
      throw error
    }
  }

  const refreshAccounts = async () => { 
    try {
      const data = await adminService.getAccounts()
      accounts.value = data
    } catch (error) {
      console.error('Failed to refresh accounts:', error)
      throw error
    }
  }

  const refreshDealerships = async () => {
    try {
      const data = await adminService.getDealerships()
      dealerships.value = data
    } catch (error) {
      console.error('Failed to refresh dealerships:', error)
      throw error
    }
  }

  const refreshDealerGroups = async () => {
    try {
      const data = await adminService.getDealerGroups()
      dealerGroups.value = data
    } catch (error) {
      console.error('Failed to refresh dealer groups:', error)
      throw error
    }
  }

  const addAccount = (account: Account) => {
    accounts.value.push(account)
  }

  const updateAccount = (accountId: string, updatedAccount: Account) => {
    const index = accounts.value.findIndex(account => account.id === accountId)
    if (index !== -1) {
      accounts.value[index] = updatedAccount
    }
  }

  const removeAccount = (accountId: string) => {
    accounts.value = accounts.value.filter(account => account.id !== accountId)
  }

  const addDealership = (dealership: Dealership) => {
    dealerships.value.push(dealership)
  }

  const updateDealership = (dealershipId: string, updatedDealership: Dealership) => {
    const index = dealerships.value.findIndex(dealership => dealership.id === dealershipId)
    if (index !== -1) {
      dealerships.value[index] = updatedDealership
    }
  }

  const removeDealership = (dealershipId: string) => {
    dealerships.value = dealerships.value.filter(dealership => dealership.id !== dealershipId)
  }

  const addDealerGroup = (dealerGroup: DealerGroup) => {
    dealerGroups.value.push(dealerGroup)
  }

  const updateDealerGroup = (dealerGroupId: string, updatedDealerGroup: DealerGroup) => {
    const index = dealerGroups.value.findIndex(group => group.id === dealerGroupId)
    if (index !== -1) {
      dealerGroups.value[index] = updatedDealerGroup
    }
  }

  const removeDealerGroup = (dealerGroupId: string) => {
    dealerGroups.value = dealerGroups.value.filter(group => group.id !== dealerGroupId)
  }

  const addPolicy = (policy: Policy) => {
    policies.value.push(policy)
  }

  const updatePolicy = (policyId: string, updatedPolicy: Policy) => {
    const index = policies.value.findIndex(policy => policy.id === policyId)
    if (index !== -1) {
      policies.value[index] = updatedPolicy
    }
  }

  const removePolicy = (policyId: string) => {
    policies.value = policies.value.filter(policy => policy.id !== policyId)
  }

  // Clear all store data
  const clearStore = () => {
    accounts.value = []
    dealerships.value = []
    dealerGroups.value = []
    policies.value = []
    selectedDealership.value = null
    
    // Reset initialization flags
    policiesInitialized.value = false
    accountsInitialized.value = false
    dealershipsInitialized.value = false
    dealerGroupsInitialized.value = false
  }

  return {
    // State
    accounts,
    dealerships,
    dealerGroups,
    policies,
    selectedDealership,
    policiesInitialized,
    accountsInitialized,
    dealershipsInitialized,
    dealerGroupsInitialized,
    
    // Computed
    totalAccounts,
    totalDealerships,
    totalDealerGroups,
    totalPolicies,
    
    // Actions
    initializePolicies,
    initializeAccounts,
    initializeDealerships,
    initializeDealerGroups,
    initializeUserData,
    getInitialData,
    setAccounts,
    setDealerships,
    setDealerGroups,
    setPolicies,
    refreshPolicies,
    refreshAccounts,
    refreshDealerships,
    refreshDealerGroups,
    addAccount,
    updateAccount,
    removeAccount,
    addDealership,
    updateDealership,
    removeDealership,
    addDealerGroup,
    updateDealerGroup,
    removeDealerGroup,
    addPolicy,
    updatePolicy,
    removePolicy,
    clearStore
  }
})