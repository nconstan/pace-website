import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dashboardService, { type DashboardStats, type QuickQuote } from '../services/dashboard.service'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const quickQuotes = ref<QuickQuote[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const totalPolicies = computed(() => stats.value?.totalPolicies || 0)
  const totalQuotes = computed(() => stats.value?.totalQuotes || 0)
  const recentPolicies = computed(() => stats.value?.recentPolicies || [])
  const recentQuotes = computed(() => stats.value?.recentQuotes || [])

  // Mock data for dashboard metrics
  const metrics = ref({
    pendingPolicies: 12,
    soldThisMonth: 45,
    topSeller: 'John Doe',
    activePolicies: 234
  })

  const chartData = ref({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Policies Sold',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Revenue',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  })

  const recentActivity = ref([
    {
      id: 1,
      type: 'policy',
      message: 'New policy created for John Doe',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'claim',
      message: 'Claim submitted for policy #12345',
      time: '4 hours ago'
    },
    {
      id: 3,
      type: 'payment',
      message: 'Payment received for policy #12340',
      time: '6 hours ago'
    }
  ])

  const fetchDashboardStats = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await dashboardService.getDashboardStats()
      stats.value = data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard stats'
    } finally {
      isLoading.value = false
    }
  }

  const fetchQuickQuotes = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await dashboardService.getQuickQuotes()
      quickQuotes.value = data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch quick quotes'
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Clear all store data
  const clearStore = () => {
    stats.value = null
    quickQuotes.value = []
    isLoading.value = false
    error.value = null
    
    // Reset metrics to default values
    metrics.value = {
      pendingPolicies: 0,
      soldThisMonth: 0,
      topSeller: '',
      activePolicies: 0
    }
    
    // Reset chart data
    chartData.value = {
      labels: [],
      datasets: []
    }
    
    // Reset recent activity
    recentActivity.value = []
  }

  return {
    stats,
    quickQuotes,
    isLoading,
    error,
    totalPolicies,
    totalQuotes,
    recentPolicies,
    recentQuotes,
    metrics,
    chartData,
    recentActivity,
    fetchDashboardStats,
    fetchQuickQuotes,
    clearError,
    clearStore
  }
})