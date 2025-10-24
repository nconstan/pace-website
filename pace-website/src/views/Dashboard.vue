<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement } from 'chart.js'
import { TrendingUp, Users, FileText, Activity, DollarSign } from 'lucide-vue-next'
import { useManagementStore } from '../stores/management'

ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, PointElement)

const dashboardStore = useDashboardStore()

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Monthly Performance Overview'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

// const getActivityIcon = (type: string) => {
//   switch (type) {
//     case 'policy':
//       return FileText
//     case 'claim':
//       return Activity
//     case 'payment':
//       return DollarSign
//     default:
//       return Clock
//   }
// }

// const getActivityColor = (type: string) => {
//   switch (type) {
//     case 'policy':
//       return '#10b981'
//     case 'claim':
//       return '#f59e0b'
//     case 'payment':
//       return '#3b82f6'
//     default:
//       return '#6b7280'
//   }
// }

onMounted(async () => {
  if(useManagementStore().dealerships.length === 0) {    
    useManagementStore().selectedDealership = useManagementStore().dealerships[0] || null
  }
  console.log("selected dealership", useManagementStore().selectedDealership)
})
</script>

<template>
  <div class="dealership-selector">
    <select v-model="useManagementStore().selectedDealership" class="dealership-dropdown">      
      <option v-for="dealership in useManagementStore().dealerships" :key="dealership.id" :value="dealership">
        {{ dealership.name }}
      </option>
    </select>
  </div>
  <div class="dashboard">
    <!-- Top Metrics Bar -->
    <div class="metrics-bar">
      <div class="metric-card">
        <div class="metric-icon pending">
          <FileText class="icon" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ dashboardStore.metrics.pendingPolicies }}</div>
          <div class="metric-label">Policies Pending</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon sold">
          <TrendingUp class="icon" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ dashboardStore.metrics.soldThisMonth }}</div>
          <div class="metric-label">Sold This Month</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon seller">
          <Users class="icon" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ dashboardStore.metrics.topSeller }}</div>
          <div class="metric-label">Top Seller</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon active">
          <Activity class="icon" />
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ dashboardStore.metrics.activePolicies }}</div>
          <div class="metric-label">Active Policies</div>
        </div>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-container">
        <div class="chart-header">
          <h2 class="chart-title">Performance Analytics</h2>
          <div class="chart-actions">
            <select class="chart-filter">
              <option value="6months">Last 6 Months</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div class="chart-wrapper">
          <Line
            :data="dashboardStore.chartData"
            :options="chartOptions"
          />
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">Conversion Rate</h3>
            <TrendingUp class="stat-icon up" />
          </div>
          <div class="stat-value">78.5%</div>
          <div class="stat-change positive">+12% vs last month</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">Average Policy Value</h3>
            <DollarSign class="stat-icon" />
          </div>
          <div class="stat-value">$2,450</div>
          <div class="stat-change positive">+8% vs last month</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">Customer Satisfaction</h3>
            <Users class="stat-icon" />
          </div>
          <div class="stat-value">4.8/5</div>
          <div class="stat-change positive">+0.2 vs last month</div>
        </div>
      </div>
    </div>
    
    <!-- Recent Activity Bar -->
    <div class="activity-section">
      <div class="activity-header">
        <h2 class="activity-title">Recent Quick Quotes</h2>
        <button class="view-all-button">View All</button>
      </div>
      <div class="activity-list" v-if="dashboardStore.quickQuotes.length > 0">
        <div
          v-for="(quickQuote, index) in dashboardStore.quickQuotes"
          :key="index"
          class="activity-item"
        >
          <div class="activity-content">
                         <div class="activity-message">{{ quickQuote.policyData?.vin || 'N/A' }}</div>
                         <div class="activity-time">{{ quickQuote.createdAt }}</div>
          </div>
        </div>
      </div>
      <div class="activity-list" v-else>
        <div class="activity-item">
          <div class="activity-message">No Recent Quick Quotes</div>
        </div>
      </div>
    </div> 


    <!-- <div class="activity-section">
      <div class="activity-header">
        <h2 class="activity-title">Recent Activity</h2>
        <button class="view-all-button">View All</button>
      </div>
      
      <div class="activity-list">
        <div
          v-for="activity in dashboardStore.recentActivity"
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon" :style="{ backgroundColor: getActivityColor(activity.type) }">
            <component :is="getActivityIcon(activity.type)" class="icon" />
          </div>
          <div class="activity-content">
            <div class="activity-message">{{ activity.message }}</div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Metrics Bar */
.metrics-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.metric-icon.sold {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.metric-icon.seller {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.metric-icon.active {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.metric-icon .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-filter {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.stat-icon.up {
  color: #10b981;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

/* Activity Section */
.activity-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.activity-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.view-all-button {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.view-all-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background: #f3f4f6;
}

.activity-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.activity-icon .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .metrics-bar {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .metrics-bar {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .activity-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>