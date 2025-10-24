<template>
    <div class="step-content">
        <div class="step-panel">
            <h2 class="step-heading">Applicant Information</h2> 
            <div class="form-grid">
                <div class="form-group">
                    <div class="label-row">
                        <label for="name" class="form-label">Name</label>
                        <div class="organization-toggle">
                            <label class="checkbox-label">
                                <input v-model="policyData.applicant.isOrganization" type="checkbox" value="false" class="checkbox-input"/>
                                <span class="checkbox-text">Organization</span>
                            </label>
                        </div>
                    </div>
                    <input 
                        id="name" 
                        v-model="policyData.applicant.primaryName" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('applicant.primaryName') }" 
                        :placeholder="policyData.applicant.isOrganization ? 'Organization Name' : 'Full Name'"
                        @blur="markFieldAsTouched('applicant.primaryName')"
                    />
                    <div v-if="shouldShowError('applicant.primaryName')" class="error-message">{{ validationErrors.applicant.primaryName }}</div>
                </div>
                <div class="form-group">
                    <label for="postalCode" class="form-label">Applicant Postal Code</label>
                    <input 
                        id="postalCode" 
                        v-model="policyData.applicant.postalCode" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('applicant.postalCode') }" 
                        placeholder="Applicant Postal Code"
                        @blur="markFieldAsTouched('applicant.postalCode')"
                    />
                    <div v-if="shouldShowError('applicant.postalCode')" class="error-message">{{ validationErrors.applicant.postalCode }}</div>
                </div>
                <div class="form-group full-width">
                    <label for="secondaryName" class="form-label">{{policyData.applicant.isOrganization ? 'Primary Contact' : 'Secondary Applicant'}}</label>
                    <input 
                        id="secondaryName" 
                        v-model="policyData.applicant.secondaryName" 
                        type="text" 
                        class="form-input" 
                        :placeholder="policyData.applicant.isOrganization ? 'Primary Contact Full Name' : 'Secondary Applicant Full Name (Optional)'"
                        @blur="markFieldAsTouched('applicant.secondaryName')"
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="step-content">
        <div class="step-panel">
            <h2 class="step-heading">Vehicle Information</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label for="vin" class="form-label">Vehicle Identification Number (VIN)</label>
                    <input 
                        id="vin" 
                        v-model="policyData.vehicle.vin" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('vehicle.vin') }" 
                        placeholder="Enter 17-digit VIN" 
                        maxlength="17" 
                        @change="getVIN"
                        @blur="markFieldAsTouched('vehicle.vin')"
                    />
                    <div v-if="shouldShowError('vehicle.vin')" class="error-message">{{ validationErrors.vehicle.vin }}</div>
                </div>

                <div class="form-group">
                    <label for="odometer" class="form-label">Odometer Reading</label>
                    <input 
                        id="odometer" 
                        v-model="policyData.vehicle.odometer" 
                        type="number" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('vehicle.odometer') }" 
                        placeholder="Enter mileage"
                        @blur="markFieldAsTouched('vehicle.odometer')"
                    />
                    <div v-if="shouldShowError('vehicle.odometer')" class="error-message">{{ validationErrors.vehicle.odometer }}</div>
                </div>

                <div class="form-group">
                    <label for="vehiclePurchaseMethod" class="form-label">Vehicle Purchase Method</label>
                    <select id="vehiclePurchaseMethod" v-model="policyData.vehicle.purchaseMethod" class="form-select">
                        <option v-for="type in ['financed', 'lease', 'cash']" :key="type" :value="type">{{ type.charAt(0).toUpperCase() + type.slice(1) }}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="vehiclePurchase" class="form-label">Vehicle Purchase Price</label>
                    <input 
                        id="vehiclePurchase" 
                        v-model="policyData.vehicle.purchasePrice" 
                        type="number" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('vehicle.purchasePrice') }" 
                        placeholder="Enter purchase price"
                        @blur="markFieldAsTouched('vehicle.purchasePrice')"
                    />
                    <div v-if="shouldShowError('vehicle.purchasePrice')" class="error-message">{{ validationErrors.vehicle.purchasePrice }}</div>
                </div>
            </div>
        </div>
    </div>

    <transition name="slide-fade">
        <div v-if="policyData.vehicle.make !== ''" class="step-content">
            <h3 class="vehicle-title">Vehicle Details</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label for="make" class="form-label">Make</label>
                    <input type="text" v-model="policyData.vehicle.make" class="form-input" placeholder="Make" />
                </div>
                <div class="form-group">
                    <label for="model" class="form-label">Model</label>
                    <input type="text" v-model="policyData.vehicle.model" class="form-input" placeholder="Model" />
                </div>
                <div class="form-group">
                    <label for="series" class="form-label">Series</label>
                    <input type="text" v-model="policyData.vehicle.series" class="form-input" placeholder="Series" />
                </div>
                <div class="form-group">
                    <label for="year" class="form-label">Model Year</label>
                    <input type="number" v-model="policyData.vehicle.modelYear" class="form-input" placeholder="Model Year" />
                </div>
            </div>
        </div>
    </transition>

    <transition name="slide-fade">
        <div v-if="policyData.vehicle.purchaseMethod !== 'cash' && policyData.vehicle.purchaseMethod !== ''" class="step-content">
            <h3 class="vehicle-title">{{policyData.vehicle.purchaseMethod === 'financed' ? 'Financing Information' : 'Lease Information'}}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label for="totalAmount" class="form-label">Total Amount</label>
                    <input type="number" v-model="policyData.debtInfo.totalAmount" class="form-input" placeholder="Total Amount" />
                </div>
                <div class="form-group">
                    <label for="interestRate" class="form-label">Interest Rate</label>
                    <input type="number" v-model="policyData.debtInfo.interestRate" class="form-input" placeholder="Annual Interest Rate (%) " />
                </div>
                <div class="form-group">
                    <label for="financeTerm" class="form-label">{{policyData.vehicle.purchaseMethod === 'financed' ? 'Finance Term' : 'Lease Term'}}</label>
                    <input type="number" v-model="policyData.debtInfo.debtTerm" class="form-input" placeholder="Finance Term (months)" />
                </div>
                <div class="form-group">
                    <label for="monthlyPayment" class="form-label">Monthly Payment</label>
                    <input type="number" v-model="policyData.debtInfo.monthlyPayment" class="form-input" placeholder="Monthly Payment" />
                </div>
                <div class="form-group">
                    <label for="residualValue" class="form-label">Residual Value</label>
                    <input type="number" v-model="policyData.debtInfo.residualValue" class="form-input" placeholder="Residual Value" />
                </div>
                <div class="form-group">
                    <label for="rolledInNegativeEquity" class="form-label">Rolled in Negative Equity</label>
                    <input type="number" v-model="policyData.debtInfo.rolledInNegativeEquity" class="form-input" placeholder="Rolled in Negative Equity" />
                </div>
                <div class="form-group">
                    <label for="DebtDownPayment" class="form-label">Debt Down Payment</label>
                    <input type="number" v-model="policyData.debtInfo.downPayment" class="form-input" placeholder="Debt Down Payment" />
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">

// This component receives props from the parent PolicyCreation component
const props = defineProps<{
  policyData: any
  getVIN: () => void
  validationErrors: any
  touchedFields: any
  markFieldAsTouched: (path: string) => void
  shouldShowError: (path: string) => boolean
  calculatePricing: (policyData: any) => void
}>()
void props

</script>

<script lang="ts">
export default {
  name: 'PCSection1'
}
</script>

<style src="./section-shared.css"></style>
<style scoped>
.step-panel {
  min-height: 100px;
  position: relative;
}

.step-content {
  position: relative;
}

.vehicle-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.vehicle-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vehicle-detail {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
}

/* Error styling */
.form-input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Transition classes for slide-fade */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
