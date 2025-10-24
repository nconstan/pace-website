<template>
  <div class="step-panel">
    <h2 class="step-heading">Review & Confirm</h2>
    <div class="summary-sections">
      
      <!-- Applicant Information -->
      <div class="summary-section">
        <h3 class="summary-title">Applicant Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Name:</span>
            <span class="summary-value">{{ policyData.applicant.primaryName }}</span>
          </div>
          <div v-if="policyData.applicant.isOrganization" class="summary-item">
            <span class="summary-label">Organization Type:</span>
            <span class="summary-value">Organization</span>
          </div>
          <div v-if="policyData.applicant.secondaryName" class="summary-item">
            <span class="summary-label">{{ policyData.applicant.isOrganization ? 'Primary Contact' : 'Secondary Applicant' }}:</span>
            <span class="summary-value">{{ policyData.applicant.secondaryName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Address:</span>
            <span class="summary-value">
              {{ policyData.applicant.street }}{{ policyData.applicant.street2 ? ', ' + policyData.applicant.street2 : '' }}, {{ policyData.applicant.city }}, {{ policyData.applicant.province }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Postal Code:</span>
            <span class="summary-value">{{ policyData.applicant.postalCode }}</span>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="summary-section">
        <h3 class="summary-title">Contact Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Phone Number:</span>
            <span class="summary-value">{{ policyData.contactInfo.primary.phoneNumber.value }}</span>
          </div>
          <div v-if="policyData.contactInfo.primary.secondaryPhoneNumber.value" class="summary-item">
            <span class="summary-label">Secondary Phone:</span>
            <span class="summary-value">{{ policyData.contactInfo.primary.secondaryPhoneNumber.value }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Email:</span>
            <span class="summary-value">{{ policyData.contactInfo.primary.email.value }}</span>
          </div>
          <div v-if="policyData.contactInfo.primary.secondaryEmail.value" class="summary-item">
            <span class="summary-label">Secondary Email:</span>
            <span class="summary-value">{{ policyData.contactInfo.primary.secondaryEmail.value }}</span>
          </div>
          
          <!-- Secondary Applicant Contact Info -->
          <div v-if="policyData.applicant.secondaryName && !policyData.applicant.isOrganization">
            <div class="summary-subtitle">Secondary Applicant Contact</div>
            <div v-if="policyData.contactInfo.secondary.phoneNumber.value" class="summary-item">
              <span class="summary-label">Phone Number:</span>
              <span class="summary-value">{{ policyData.contactInfo.secondary.phoneNumber.value }}</span>
            </div>
            <div v-if="policyData.contactInfo.secondary.secondaryPhoneNumber.value" class="summary-item">
              <span class="summary-label">Secondary Phone:</span>
              <span class="summary-value">{{ policyData.contactInfo.secondary.secondaryPhoneNumber.value }}</span>
            </div>
            <div v-if="policyData.contactInfo.secondary.email.value" class="summary-item">
              <span class="summary-label">Email:</span>
              <span class="summary-value">{{ policyData.contactInfo.secondary.email.value }}</span>
            </div>
            <div v-if="policyData.contactInfo.secondary.secondaryEmail.value" class="summary-item">
              <span class="summary-label">Secondary Email:</span>
              <span class="summary-value">{{ policyData.contactInfo.secondary.secondaryEmail.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Information -->
      <div class="summary-section">
        <h3 class="summary-title">Vehicle Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">VIN:</span>
            <span class="summary-value">{{ policyData.vehicle.vin }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Odometer:</span>
            <span class="summary-value">{{ policyData.vehicle.odometer }} miles</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Purchase Method:</span>
            <span class="summary-value">{{ policyData.vehicle.purchaseMethod.charAt(0).toUpperCase() + policyData.vehicle.purchaseMethod.slice(1) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Purchase Price:</span>
            <span class="summary-value">${{ policyData.vehicle.purchasePrice }}</span>
          </div>
          
          <!-- Vehicle Details (if VIN was entered) -->
          <div v-if="policyData.vehicle.make">
            <div class="summary-subtitle">Vehicle Details</div>
            <div class="summary-item">
              <span class="summary-label">Make:</span>
              <span class="summary-value">{{ policyData.vehicle.make }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Model:</span>
              <span class="summary-value">{{ policyData.vehicle.model }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Series:</span>
              <span class="summary-value">{{ policyData.vehicle.series }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Year:</span>
              <span class="summary-value">{{ policyData.vehicle.modelYear }}</span>
            </div>
          </div>

          <!-- Financing Information -->
          <div v-if="policyData.vehicle.purchaseMethod !== 'cash'">
            <div class="summary-subtitle">{{ policyData.vehicle.purchaseMethod === 'financed' ? 'Financing' : 'Lease' }} Information</div>
            <div class="summary-item">
              <span class="summary-label">Total Amount:</span>
              <span class="summary-value">${{ policyData.debtInfo.totalAmount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Interest Rate:</span>
              <span class="summary-value">{{ policyData.debtInfo.interestRate }}%</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ policyData.vehicle.purchaseMethod === 'financed' ? 'Finance' : 'Lease' }} Term:</span>
              <span class="summary-value">{{ policyData.debtInfo.debtTerm }} months</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Monthly Payment:</span>
              <span class="summary-value">${{ policyData.debtInfo.monthlyPayment }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Residual Value:</span>
              <span class="summary-value">${{ policyData.debtInfo.residualValue }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Policy Details -->
      <div class="summary-section">
        <h3 class="summary-title">Policy Details</h3>
        <div class="summary-content">
          <!-- Selected Products -->
          <div v-for="(product, index) in selectedProducts" :key="index">
            <div class="summary-item">
              <span class="summary-label">{{ index === 0 ? 'Primary Product' : 'Secondary Product' }}:</span>
              <span class="summary-value">{{ getProductDisplayName(product.productName) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Term:</span>
              <span class="summary-value">{{ product.productTerm }} months</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Price:</span>
              <span class="summary-value">${{ product.price.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="summary-item">
            <span class="summary-label">Payment Method:</span>
            <span class="summary-value">
              {{ 
                policyData.paymentInfo.paymentMethod === 'vehicle-financing' ? 'Add to Vehicle Financing' :
                policyData.paymentInfo.paymentMethod === 'credit-card' ? 'Credit Card' :
                policyData.paymentInfo.paymentMethod === 'policy-financing' ? 'Policy Financing' : ''
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Payment Information -->
      <div v-if="policyData.paymentInfo.paymentMethod === 'credit-card'" class="summary-section">
        <h3 class="summary-title">Credit Card Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Card Number:</span>
            <span class="summary-value">**** **** **** {{ policyData.paymentInfo.cardNumber.slice(-4) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Expiry Date:</span>
            <span class="summary-value">{{ policyData.paymentInfo.expiryDate }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Cardholder Name:</span>
            <span class="summary-value">{{ policyData.paymentInfo.cardHolderName }}</span>
          </div>
          <div v-if="policyData.paymentInfo.billingAddress" class="summary-item">
            <span class="summary-label">Billing Address:</span>
            <span class="summary-value">{{ policyData.paymentInfo.billingAddress }}</span>
          </div>
        </div>
      </div>

      <!-- Vehicle Financing Information -->
      <div v-if="policyData.paymentInfo.paymentMethod === 'vehicle-financing'" class="summary-section">
        <h3 class="summary-title">Vehicle Financing Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Lienholder Name:</span>
            <span class="summary-value">{{ policyData.paymentInfo.lienholderName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Loan Number:</span>
            <span class="summary-value">{{ policyData.paymentInfo.loanNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Policy Financing Information -->
      <div v-if="policyData.paymentInfo.paymentMethod === 'policy-financing'" class="summary-section">
        <h3 class="summary-title">Policy Financing Information</h3>
        <div class="summary-content">
          <div class="summary-item">
            <span class="summary-label">Financing Method:</span>
            <span class="summary-value">
              {{ policyData.paymentInfo.financingMethod === 'credit-card' ? 'Credit Card' : 'Direct Deposit' }}
            </span>
          </div>
          
          <!-- Credit Card Details -->
          <div v-if="policyData.paymentInfo.financingMethod === 'credit-card'">
            <div class="summary-subtitle">Credit Card Details</div>
            <div class="summary-item">
              <span class="summary-label">Card Number:</span>
              <span class="summary-value">**** **** **** {{ policyData.paymentInfo.cardNumber.slice(-4) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Expiry Date:</span>
              <span class="summary-value">{{ policyData.paymentInfo.expiryDate }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Cardholder Name:</span>
              <span class="summary-value">{{ policyData.paymentInfo.cardHolderName }}</span>
            </div>
          </div>

          <!-- Direct Deposit Details -->
          <div v-if="policyData.paymentInfo.financingMethod === 'direct-deposit'">
            <div class="summary-subtitle">Direct Deposit Details</div>
            <div class="summary-item">
              <span class="summary-label">Account Holder:</span>
              <span class="summary-value">{{ policyData.paymentInfo.accountHolderName }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Bank Name:</span>
              <span class="summary-value">{{ policyData.paymentInfo.bankName }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Bank Number:</span>
              <span class="summary-value">{{ policyData.paymentInfo.bankNumber }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Branch Number:</span>
              <span class="summary-value">{{ policyData.paymentInfo.branchNumber }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Account Number:</span>
              <span class="summary-value">{{ policyData.paymentInfo.accountNumber }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Bank Address:</span>
              <span class="summary-value">{{ policyData.paymentInfo.bankAddress }}</span>
            </div>
          </div>

          <!-- PFA Terms -->
          <div v-if="policyData.paymentInfo.PFATerm">
            <div class="summary-subtitle">Payment Terms</div>
            <div class="summary-item">
              <span class="summary-label">Number of Payments:</span>
              <span class="summary-value">{{ policyData.paymentInfo.PFATerm }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Information -->
      <div class="summary-section">
        <h3 class="summary-title">Agent Information</h3>
        <div class="summary-content">
                     <div class="summary-item">
             <span class="summary-label">Dealership:</span>
             <span class="summary-value">{{ typeof policyData.dealership === 'object' ? policyData.dealership.name : policyData.dealership }}</span>
           </div>
        </div>
      </div>

      <!-- Cost Breakdown -->
      <div class="summary-section">
        <h3 class="summary-title">Cost Breakdown</h3>
        <div class="cost-breakdown">
          <!-- Individual Product Costs -->
          <div v-for="(product, index) in selectedProducts" :key="index" class="cost-item">
            <span class="cost-label">{{ getProductDisplayName(product.productName) }}:</span>
            <span class="cost-value">${{ product.price.toFixed(2) }}</span>
          </div>
          
          <div class="cost-total">
            <span class="cost-label">Total Cost:</span>
            <span class="cost-value">${{ totalCost.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { products } from '../../Mixins/constants'

// This component receives props from the parent PolicyCreation component
const props = defineProps<{
  policyData: any
  validationErrors: any
  touchedFields: any
  markFieldAsTouched: (path: string) => void
  shouldShowError: (path: string) => boolean
}>()

// Computed property for filtered selected products
const selectedProducts = computed(() => {
  return props.policyData.selectedProducts.filter((product: any) => product.productName)
})

// Computed property for total cost
const totalCost = computed(() => {
  return selectedProducts.value.reduce((total: number, product: any) => total + product.price, 0)
})

// Function to get product display name
const getProductDisplayName = (productName: string) => {
  return products[productName as keyof typeof products]?.fullName || productName
}
</script>

<script lang="ts">
export default {
  name: 'PCSection4'
}
</script>

<style src="./section-shared.css"></style>
<style scoped>
.summary-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-section {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.summary-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 1rem 0 0.5rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 120px;
}

.summary-value {
  font-weight: 600;
  color: #1f2937;
  text-align: right;
  flex: 1;
}

.cost-breakdown {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid #ffa242;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e5e7eb;
}

.cost-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.cost-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2A525A;
}

@media (max-width: 768px) {
  .summary-item {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .summary-label {
    min-width: auto;
  }
  
  .summary-value {
    text-align: left;
  }
}
</style>

