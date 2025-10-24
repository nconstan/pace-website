<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="reports-header">
      <h1>Reports & Analytics</h1>
      <p>Generate detailed reports and visualizations of your policy data</p>
    </div>

    <!-- View Tabs -->
    <div class="view-tabs">
      <button 
        @click="activeView = 'list'" 
        :class="['tab-button', { active: activeView === 'list' }]"
      >
        <List class="tab-icon" />
        List View
      </button>
      <button 
        @click="activeView = 'graph'" 
        :class="['tab-button', { active: activeView === 'graph' }]"
      >
        <BarChart3 class="tab-icon" />
        Graph View
      </button>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-header">
        <h3>Filters</h3>
        <button @click="resetFilters" class="reset-button">
          <RotateCcw class="button-icon" />
          Reset Filters
        </button>
      </div>

      <div class="filters-grid">
        <!-- Date Range Filter -->
        <div class="filter-group">
          <label>Date Range</label>
          <div class="date-inputs">
            <input 
              type="date" 
              v-model="filters.dateFrom" 
              @change="loadData"
            />
            <span>to</span>
            <input 
              type="date" 
              v-model="filters.dateTo" 
              @change="loadData"
            />
          </div>
        </div>

        <!-- Dealer Group Filter (Role 4+ only) -->
        <div v-if="userHasRole([4, 12])" class="filter-group">
          <label>Dealer Groups</label>
          <select 
            v-model="filters.selectedDealerGroups" 
            multiple 
            @change="onDealerGroupChange"
            class="multi-select"
          >
            <option v-for="group in dealerGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>

        <!-- Dealership Filter -->
        <div class="filter-group">
          <label>Dealerships</label>
          <select 
            v-model="filters.selectedDealerships" 
            multiple 
            @change="onDealershipChange"
            class="multi-select"
          >
            <option v-for="dealership in filteredDealerships" :key="dealership.id" :value="dealership.id">
              {{ dealership.name }}
            </option>
          </select>
        </div>

        <!-- Seller Filter (Role 2+ only) -->
        <div v-if="userHasRole([2, 3, 4, 12])" class="filter-group">
          <label>Sellers</label>
          <select 
            v-model="filters.selectedSellers" 
            multiple 
            class="multi-select"
          >
            <option v-for="seller in filteredSellers" :key="seller.id" :value="seller.id">
              {{ seller.first_name }} {{ seller.last_name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label>Policy Status</label>
          <select v-model="filters.status" @change="loadData" class="single-select">
            <option value="">All Statuses</option>
            <option value="0">Pending</option>
            <option value="1">Confirmed</option>
            <option value="2">Cancelled</option>
          </select>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="activeView === 'list'" class="list-view">
      <div class="list-header">
        <h3>Policy List</h3>
        <div class="list-controls">
          <div class="column-selector">
            <label>Columns:</label>
            <div class="column-checkboxes">
              <label v-for="column in availableColumns" :key="column.key">
                <input 
                  type="checkbox" 
                  v-model="selectedColumns" 
                  :value="column.key"
                />
                {{ column.label }}
              </label>
            </div>
          </div>
          <button @click="exportData" class="export-button">
            <Download class="button-icon" />
            Export
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="column in visibleColumns" :key="column.key">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="policy in filteredPolicies" :key="policy.id">
              <td v-if="isColumnVisible('dateSold')">{{ formatDate(policy.created_at) }}</td>
              <td v-if="isColumnVisible('status')">{{ getStatusText(policy.policy_status) }}</td>
              <td v-if="isColumnVisible('totalValue')">${{ formatCurrency(policy.total_price) }}</td>
              <td v-if="isColumnVisible('netEarned')">${{ formatCurrency(getNetEarned(policy)) }}</td>
              <td v-if="isColumnVisible('seller')">{{ policy.seller.first_name }} {{ policy.seller.last_name }}</td>
              <td v-if="isColumnVisible('dealership')">{{ policy.dealerships.nickname || policy.dealerships.name }}</td>
              <td v-if="isColumnVisible('dealerGroup')">{{ getDealerGroupName(policy.dealer_group_id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Graph View -->
    <div v-if="activeView === 'graph'" class="graph-view">
      <div class="graph-header">
        <div class="graph-controls">
          <select v-model="graphType" @change="updateGraph" class="graph-type-select">
            <option value="policies">Policies Sold</option>
            <option value="value">Total Value</option>
            <option value="earned">Amount Earned</option>
          </select>
          <button @click="addComparison" class="add-comparison-button">
            <Plus class="button-icon" />
            Add Comparison
          </button>
        </div>
      </div>

      <div class="graph-container">
        <canvas ref="graphCanvas"></canvas>
      </div>

      <!-- Comparison List -->
      <div v-if="comparisons.length > 0" class="comparisons-section">
        <h4>Comparisons</h4>
        <div class="comparison-list">
          <div 
            v-for="(comparison, index) in comparisons" 
            :key="index" 
            class="comparison-item"
          >
            <span class="comparison-label">{{ comparison.label }}</span>
            <button @click="removeComparison(index)" class="remove-comparison">
              <X class="remove-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
//import { useManagementStore } from '../../stores/management'
import reportsService from '../../services/reports.service'
import { 
  List, 
  BarChart3, 
  RotateCcw, 
  Download, 
  Plus, 
  X 
} from 'lucide-vue-next'
import Chart from 'chart.js/auto'

// Store references
const authStore = useAuthStore()
//const managementStore = useManagementStore()
// Reactive data
const activeView = ref('list')
const graphType = ref('policies')
const selectedColumns = ref(['dateSold', 'status', 'totalValue', 'seller', 'dealership'])
const comparisons = ref<any[]>([])
const graphCanvas = ref<HTMLCanvasElement>()

// Filters
const filters = reactive({
  dateFrom: '',
  dateTo: '',
  selectedDealerGroups: [] as number[],
  selectedDealerships: [] as number[],
  selectedSellers: [] as number[],
  status: ''
})

// Data
const policies = ref<any[]>([])
const dealerGroups = ref<any[]>([])
const dealerships = ref<any[]>([])
const sellers = ref<any[]>([])
let chartInstance: Chart | null = null

// Available columns for list view
const availableColumns = [
  { key: 'dateSold', label: 'Date Sold' },
  { key: 'status', label: 'Status' },
  { key: 'totalValue', label: 'Total Value' },
  { key: 'netEarned', label: 'Net Earned' },
  { key: 'seller', label: 'Seller' },
  { key: 'dealership', label: 'Dealership' },
  { key: 'dealerGroup', label: 'Dealer Group' }
]

// Computed properties
const userHasRole = (roles: number[]) => {
  return authStore.user?.roles?.some((role: number) => roles.includes(role)) || false
}

const filteredDealerships = computed(() => {
  if (userHasRole([4, 12]) && filters.selectedDealerGroups.length > 0) {
    return dealerships.value.filter(d => 
      filters.selectedDealerGroups.includes(d.dealer_group_id)
    )
  }
  return dealerships.value
})

const filteredSellers = computed(() => {
  if (filters.selectedDealerships.length > 0) {
    return sellers.value.filter(s => 
      s.dealerships?.some((d: any) => 
        filters.selectedDealerships.includes(d.dealership_id)
      )
    )
  }
  return sellers.value
})

const visibleColumns = computed(() => {
  return availableColumns.filter(col => selectedColumns.value.includes(col.key))
})

const filteredPolicies = computed(() => {
  let filtered = policies.value

  console.log(filtered)

  // Apply date filters
  if (filters.dateFrom) {
    filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.dateFrom))
  }
  if (filters.dateTo) {
    filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.dateTo))
  }

  // Apply status filter
  if (filters.status !== '') {
    filtered = filtered.filter(p => p.status === parseInt(filters.status))
  }

  // Apply dealership filter
  if (filters.selectedDealerships.length > 0) {
    filtered = filtered.filter(p => filters.selectedDealerships.includes(p.dealership_id))
  }

  // Apply seller filter
  if (filters.selectedSellers.length > 0) {
    filtered = filtered.filter(p => filters.selectedSellers.includes(p.seller_id))
  }

  return filtered
})

// Methods
const isColumnVisible = (columnKey: string) => {
  return selectedColumns.value.includes(columnKey)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatCurrency = (amount: number) => {
  return amount.toFixed(2)
}

const getNetEarned = (policy: any) => {
if(authStore.user?.roles.includes(3)) {
    return policy.pricing_details.dealer_group_referral_fee
  } else if(authStore.user?.roles.includes(2)) {
    return policy.pricing_details.dealership_referral_fee
  } else if(authStore.user?.roles.includes(1)) {
    return policy.pricing_details.seller_commission
  }
  return 0
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Pending'
    case 1: return 'Confirmed'
    case 2: return 'Cancelled'
    default: return 'Unknown'
  }
}

// const getSellerName = (sellerId: number) => {
//   const seller = sellers.value.find(s => s.id === sellerId)
//   return seller ? `${seller.first_name} ${seller.last_name}` : 'Unknown'
// }

// const getDealershipName = (dealershipId: number) => {
//   const dealership = dealerships.value.find(d => d.id === dealershipId)
//   return dealership ? dealership.name : 'Unknown'
// }

const getDealerGroupName = (dealershipId: number) => {
  const dealership = dealerships.value.find(d => d.id === dealershipId)
  if (!dealership) return 'Unknown'
  
  const dealerGroup = dealerGroups.value.find(g => g.id === dealership.dealer_group_id)
  return dealerGroup ? dealerGroup.name : 'Unknown'
}

const loadData = async () => {
  try {
    // Load policies based on user role
    const policiesData = await reportsService.getPolicies(filters)
    policies.value = policiesData

    // Load reference data
    if (userHasRole([4, 12])) {
      dealerGroups.value = await reportsService.getDealerGroups()
    }
    
    dealerships.value = await reportsService.getDealerships(filters)
    sellers.value = await reportsService.getSellers(filters)

    if (activeView.value === 'graph') {
      updateGraph()
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

const onDealerGroupChange = () => {
  filters.selectedDealerships = []
  filters.selectedSellers = []
  loadData()
}

const onDealershipChange = () => {
  filters.selectedSellers = []
  loadData()
}

const resetFilters = () => {
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.selectedDealerGroups = []
  filters.selectedDealerships = []
  filters.selectedSellers = []
  filters.status = ''
  loadData()
} 

const exportData = () => {
  // Implementation for exporting data to CSV/Excel
  console.log('Exporting data...')
}

const updateGraph = () => {
  if (!chartInstance) return

  const data = getGraphData()
  
  chartInstance.data = data
  chartInstance.update()
}

const getGraphData = () => {
  // Group data by month
  const monthlyData = new Map()
  
  filteredPolicies.value.forEach(policy => {
    const date = new Date(policy.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        policies: 0,
        value: 0,
        earned: 0
      })
    }
    
    const monthData = monthlyData.get(monthKey)
    monthData.policies++
    monthData.value += policy.total_premium || 0
    monthData.earned += policy.net_earned || 0
  })

  const labels = Array.from(monthlyData.keys()).sort()
  const datasets = [{
    label: getGraphLabel(),
    data: labels.map(label => monthlyData.get(label)[graphType.value]),
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    tension: 0.1
  }]

  return { labels, datasets }
}

const getGraphLabel = () => {
  switch (graphType.value) {
    case 'policies': return 'Policies Sold'
    case 'value': return 'Total Value ($)'
    case 'earned': return 'Amount Earned ($)'
    default: return 'Data'
  }
}

const addComparison = () => {
  const comparison = {
    label: `Comparison ${comparisons.value.length + 1}`,
    data: getGraphData(),
    color: getRandomColor()
  }
  
  comparisons.value.push(comparison)
  updateComparisonGraph()
}

const removeComparison = (index: number) => {
  comparisons.value.splice(index, 1)
  updateComparisonGraph()
}

const getRandomColor = () => {
  const colors = [
    'rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)', 
    'rgb(245, 158, 11)', 'rgb(14, 165, 233)', 'rgb(236, 72, 153)'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const updateComparisonGraph = () => {
  if (!chartInstance) return

  const baseData = getGraphData()
  const datasets = [baseData.datasets[0]]

  comparisons.value.forEach(comparison => {
    datasets.push({
      ...comparison.data.datasets[0],
      borderColor: comparison.color,
      backgroundColor: comparison.color.replace('rgb', 'rgba').replace(')', ', 0.1)')
    })
  })

  chartInstance.data = {
    labels: baseData.labels,
    datasets
  }
  chartInstance.update()
}

// Lifecycle
onMounted(async () => {
  // Set default date range (last 12 months)
  const now = new Date()
  filters.dateFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]
  filters.dateTo = now.toISOString().split('T')[0]

  await loadData()

  // Initialize chart
  if (graphCanvas.value) {
    chartInstance = new Chart(graphCanvas.value, {
      type: 'line',
      data: getGraphData(),
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Policy Analytics'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
})

// Watchers
watch(activeView, (newView) => {
  if (newView === 'graph' && chartInstance) {
    updateGraph()
  }
})
</script>

<style scoped>
.reports-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-header {
  margin-bottom: 2rem;
  text-align: center;
}

.reports-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.reports-header p {
  color: #6b7280;
  font-size: 1.125rem;
}

.view-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 1rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.filters-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.reset-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #e5e7eb;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-inputs input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.multi-select, .single-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 2.5rem;
}

.multi-select {
  min-height: 6rem;
}

.list-view, .graph-view {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.column-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-checkboxes {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.column-checkboxes label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover {
  background: #059669;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  color: #000;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.graph-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.graph-type-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.add-comparison-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-comparison-button:hover {
  background: #2563eb;
}

.graph-container {
  margin-bottom: 2rem;
  height: 400px;
}

.comparisons-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.comparisons-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.comparison-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.remove-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-comparison:hover {
  background: #dc2626;
}

.remove-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
