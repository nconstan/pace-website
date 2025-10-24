<template>
    <div class="step-content">
        <div class="step-panel">
            <h2 class="step-heading">Applicant</h2>
            <div class="form-grid">
                <div class="form-group">
                    <div class="label-row">
                        <label for="name" class="form-label">Name*</label>
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
            <h2 class="step-heading">Address</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label for="address" class="form-label">Street*</label>
                    <input 
                        id="address" 
                        v-model="policyData.applicant.street" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('applicant.street') }" 
                        placeholder="Address"
                        @blur="markFieldAsTouched('applicant.street')"
                    />
                    <div v-if="shouldShowError('applicant.street')" class="error-message">{{ validationErrors.applicant.street }}</div>
                </div>
                <div class="form-group">
                    <label for="address2" class="form-label">Street 2</label>
                    <input 
                        id="address2" 
                        v-model="policyData.applicant.street2" 
                        type="text" 
                        class="form-input" 
                        placeholder="Secondary Address (Optional)"
                        @blur="markFieldAsTouched('applicant.street2')"
                    />
                </div>
                <div class="form-group">
                    <label for="city" class="form-label">City*</label>
                    <input 
                        id="city" 
                        v-model="policyData.applicant.city" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('applicant.city') }" 
                        placeholder="City"
                        @blur="markFieldAsTouched('applicant.city')"
                    />
                    <div v-if="shouldShowError('applicant.city')" class="error-message">{{ validationErrors.applicant.city }}</div>
                </div>
                <ProvinceSelect
                    v-model="policyData.applicant.province"
                    :has-error="!!shouldShowError('applicant.province')"
                    :error-message="validationErrors.applicant.province"
                    @blur="markFieldAsTouched('applicant.province')"
                />
            </div>
        </div>
    </div>
    <div class="step-content">
        <div class="step-panel">
            <h2 class="step-heading">Contact Information</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label for="phoneNumber" class="form-label">Phone Number*</label>
                    <input 
                        id="phoneNumber" 
                        v-model="policyData.contactInfo.primary.phoneNumber.value" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('contactInfo.primary.phoneNumber') }" 
                        placeholder="Phone Number"
                        @blur="markFieldAsTouched('contactInfo.primary.phoneNumber')"
                    />
                    <div v-if="shouldShowError('contactInfo.primary.phoneNumber')" class="error-message">{{ validationErrors.contactInfo.primary.phoneNumber }}</div>
                </div>
                <div class="form-group">
                    <label for="secondaryPhone" class="form-label">Secondary Phone Number</label>
                    <input 
                        id="secondaryPhone" 
                        v-model="policyData.contactInfo.primary.secondaryPhoneNumber.value" 
                        type="text" 
                        class="form-input" 
                        placeholder="Secondary Phone Number (Optional)"
                        @blur="markFieldAsTouched('contactInfo.primary.secondaryPhoneNumber')"
                    />
                </div>
                <div class="form-group">
                    <label for="email" class="form-label">Email*</label>
                    <input 
                        id="email" 
                        v-model="policyData.contactInfo.primary.email.value" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('contactInfo.primary.email') }" 
                        placeholder="Email"
                        @blur="markFieldAsTouched('contactInfo.primary.email')"
                    />
                    <div v-if="shouldShowError('contactInfo.primary.email')" class="error-message">{{ validationErrors.contactInfo.primary.email }}</div>
                </div>
                <div class="form-group">
                    <label for="secondaryEmail" class="form-label">Secondary Email</label>
                    <input 
                        id="secondaryEmail" 
                        v-model="policyData.contactInfo.primary.secondaryEmail.value" 
                        type="text" 
                        class="form-input" 
                        placeholder="Secondary Email (Optional)"
                        @blur="markFieldAsTouched('contactInfo.primary.secondaryEmail')"
                    />
                </div>

                <transition name="slide-fade">
                    <h3 v-if="policyData.applicant.secondaryName.length > 0 && !policyData.applicant.isOrganization" class="section-heading full-width">Secondary Applicant</h3>
                </transition>
                <transition name="slide-fade">
                    <div v-if="policyData.applicant.secondaryName.length > 0 && !policyData.applicant.isOrganization" class="form-group">
                        <label for="secondaryPhoneNumber" class="form-label">Phone Number</label>
                        <input 
                            id="secondaryPhoneNumber" 
                            v-model="policyData.contactInfo.secondary.phoneNumber.value" 
                            type="text" 
                            class="form-input" 
                            :class="{ 'error': shouldShowError('contactInfo.secondary.phoneNumber') }" 
                            placeholder="Phone Number (Optional)"
                            @blur="markFieldAsTouched('contactInfo.secondary.phoneNumber')"
                        />
                        <div v-if="shouldShowError('contactInfo.secondary.phoneNumber')" class="error-message">{{ validationErrors.contactInfo.secondary.phoneNumber }}</div>
                    </div>
                </transition>
                <transition name="slide-fade">
                    <div v-if="policyData.applicant.secondaryName.length > 0 && !policyData.applicant.isOrganization" class="form-group">
                        <label for="secondaryPhoneNumber2" class="form-label">Secondary Phone Number</label>
                        <input 
                            id="secondaryPhoneNumber2" 
                            v-model="policyData.contactInfo.secondary.secondaryPhoneNumber.value" 
                            type="text" 
                            class="form-input" 
                            placeholder="Secondary Phone Number (Optional)"
                            @blur="markFieldAsTouched('contactInfo.secondary.secondaryPhoneNumber')"
                        />
                    </div>
                </transition>
                <transition name="slide-fade">
                    <div v-if="policyData.applicant.secondaryName.length > 0 && !policyData.applicant.isOrganization" class="form-group">
                        <label for="secondaryEmail2" class="form-label">Email</label>
                        <input 
                            id="secondaryEmail2" 
                            v-model="policyData.contactInfo.secondary.email.value" 
                            type="text" 
                            class="form-input" 
                            :class="{ 'error': shouldShowError('contactInfo.secondary.email') }" 
                            placeholder="Email (Optional)"
                            @blur="markFieldAsTouched('contactInfo.secondary.email')"
                        />
                        <div v-if="shouldShowError('contactInfo.secondary.email')" class="error-message">{{ validationErrors.contactInfo.secondary.email }}</div>
                    </div>
                </transition>
                <transition name="slide-fade">
                    <div v-if="policyData.applicant.secondaryName.length > 0 && !policyData.applicant.isOrganization" class="form-group">
                        <label for="secondaryEmail3" class="form-label">Secondary Email</label>
                        <input 
                            id="secondaryEmail3" 
                            v-model="policyData.contactInfo.secondary.secondaryEmail.value" 
                            type="text" 
                            class="form-input" 
                            placeholder="Secondary Email (Optional)"
                            @blur="markFieldAsTouched('contactInfo.secondary.secondaryEmail')"
                        />
                    </div>
                </transition>
            </div>
        </div>
    </div>
    
    <div class="step-content" v-if="policyData.paymentInfo.paymentMethod === 'credit-card'">
        <div class="step-panel">
            <h2 class="step-heading">Credit Card Information</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label for="cardNumber" class="form-label">Card Number</label>
                    <input 
                        id="cardNumber" 
                        v-model="policyData.paymentInfo.cardNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.cardNumber') }" 
                        placeholder="1234 5678 9012 3456"
                        @blur="markFieldAsTouched('paymentInfo.cardNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.cardNumber')" class="error-message">{{ validationErrors.paymentInfo.cardNumber }}</div>
                </div>
                
                <div class="form-group">
                    <label for="expiryDate" class="form-label">Expiry Date</label>
                    <input 
                        id="expiryDate" 
                        v-model="policyData.paymentInfo.expiryDate" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.expiryDate') }" 
                        placeholder="MM/YY"
                        @blur="markFieldAsTouched('paymentInfo.expiryDate')"
                    />
                    <div v-if="shouldShowError('paymentInfo.expiryDate')" class="error-message">{{ validationErrors.paymentInfo.expiryDate }}</div>
                </div>
                
                <div class="form-group">
                    <label for="cardHolderName" class="form-label">Cardholder Name</label>
                    <input 
                        id="cardHolderName" 
                        v-model="policyData.paymentInfo.cardHolderName" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.cardHolderName') }" 
                        placeholder="Full name on card"
                        @blur="markFieldAsTouched('paymentInfo.cardHolderName')"
                    />
                    <div v-if="shouldShowError('paymentInfo.cardHolderName')" class="error-message">{{ validationErrors.paymentInfo.cardHolderName }}</div>
                </div>

                <div class="form-group">
                    <label for="cvv" class="form-label">CVV</label>
                    <input 
                        id="cvv" 
                        v-model="policyData.paymentInfo.cvv" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.cvv') }" 
                        placeholder="123" 
                        maxlength="3"
                        @blur="markFieldAsTouched('paymentInfo.cvv')"
                    />
                    <div v-if="shouldShowError('paymentInfo.cvv')" class="error-message">{{ validationErrors.paymentInfo.cvv }}</div>
                </div>
                
                <div class="form-group full-width">
                    <label for="billingAddress" class="form-label">Billing Address</label>
                    <textarea 
                        id="billingAddress" 
                        v-model="policyData.paymentInfo.billingAddress" 
                        class="form-textarea" 
                        placeholder="Enter billing address" 
                        rows="3"
                        @blur="markFieldAsTouched('paymentInfo.billingAddress')"
                    ></textarea>
                </div>
            </div>
        </div>
    </div>

    <div class="step-content" v-if="policyData.paymentInfo.paymentMethod === 'vehicle-financing'">
        <div class="step-panel">
            <h2 class="step-heading">Payment Information</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label for="lienholderName" class="form-label">Lienholder Name*</label>
                    <input 
                        id="lienholderName" 
                        v-model="policyData.paymentInfo.lienholderName" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.lienholderName') }" 
                        placeholder="Lienholder Name"
                        @blur="markFieldAsTouched('paymentInfo.lienholderName')"
                    />
                    <div v-if="shouldShowError('paymentInfo.lienholderName')" class="error-message">{{ validationErrors.paymentInfo.lienholderName }}</div>
                </div>
                
                <div class="form-group">
                    <label for="loanNumber" class="form-label">Loan Number*</label>
                    <input 
                        id="loanNumber" 
                        v-model="policyData.paymentInfo.loanNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.loanNumber') }" 
                        placeholder="Loan Number"
                        @blur="markFieldAsTouched('paymentInfo.loanNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.loanNumber')" class="error-message">{{ validationErrors.paymentInfo.loanNumber }}</div>
                </div>
                
            </div>
        </div>
    </div>

    <div class="step-content" v-if="policyData.paymentInfo.paymentMethod === 'policy-financing'">
        <div class="step-panel">
            <h2 class="step-heading">Payment Information</h2>
            <div class="form-group">
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" 
                               id="credit-card" 
                               value="credit-card"
                               v-model="policyData.paymentInfo.financingMethod"
                               name="financingMethod">
                        <label for="credit-card">Credit Card</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio"
                               id="direct-deposit"
                               value="direct-deposit" 
                               v-model="policyData.paymentInfo.financingMethod"
                               name="financingMethod">
                        <label for="direct-deposit">Direct Deposit</label>
                    </div>
                </div>
            </div>
            
            <div v-if="policyData.paymentInfo.financingMethod === 'credit-card'" class="form-grid">
                <div class="form-group">
                    <label for="cardNumber2" class="form-label">Card Number*</label>
                    <input 
                        id="cardNumber2" 
                        v-model="policyData.paymentInfo.cardNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.cardNumber') }" 
                        placeholder="1234 5678 9012 3456"
                        @blur="markFieldAsTouched('paymentInfo.cardNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.cardNumber')" class="error-message">{{ validationErrors.paymentInfo.cardNumber }}</div>
                </div>
                
                <div class="form-group">
                    <label for="expiryDate2" class="form-label">Expiry Date</label>
                    <input 
                        id="expiryDate2" 
                        v-model="policyData.paymentInfo.expiryDate" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.expiryDate') }" 
                        placeholder="MM/YY"
                        @blur="markFieldAsTouched('paymentInfo.expiryDate')"
                    />
                    <div v-if="shouldShowError('paymentInfo.expiryDate')" class="error-message">{{ validationErrors.paymentInfo.expiryDate }}</div>
                </div>
                
                <div class="form-group">
                    <label for="cardHolderName2" class="form-label">Cardholder Name*</label>
                    <input 
                        id="cardHolderName2" 
                        v-model="policyData.paymentInfo.cardHolderName" 
                        type="text" 
                        class="form-input" 
                        placeholder="Full name on card"
                        @blur="markFieldAsTouched('paymentInfo.cardHolderName')"
                    />
                </div>

                <div class="form-group">
                    <label for="cvv2" class="form-label">CVV*</label>
                    <input 
                        id="cvv2" 
                        v-model="policyData.paymentInfo.cvv" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.cvv') }" 
                        placeholder="123" 
                        maxlength="3"
                        @blur="markFieldAsTouched('paymentInfo.cvv')"
                    />
                    <div v-if="shouldShowError('paymentInfo.cvv')" class="error-message">{{ validationErrors.paymentInfo.cvv }}</div>
                </div>
                
            </div>
            <div v-if="policyData.paymentInfo.financingMethod === 'direct-deposit'" class="form-grid">
                <div class="form-group">
                    <label for="accountHolderName" class="form-label">Account Holder Name*</label>
                    <input 
                        id="accountHolderName" 
                        v-model="policyData.paymentInfo.accountHolderName" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.accountHolderName') }" 
                        placeholder="Account Holder Name"
                        @blur="markFieldAsTouched('paymentInfo.accountHolderName')"
                    />
                    <div v-if="shouldShowError('paymentInfo.accountHolderName')" class="error-message">{{ validationErrors.paymentInfo.accountHolderName }}</div>
                </div>
                <div class="form-group">
                    <label for="bankName" class="form-label">Bank Name*</label>
                    <input 
                        id="bankName" 
                        v-model="policyData.paymentInfo.bankName" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.bankName') }" 
                        placeholder="Bank Name"
                        @blur="markFieldAsTouched('paymentInfo.bankName')"
                    />
                    <div v-if="shouldShowError('paymentInfo.bankName')" class="error-message">{{ validationErrors.paymentInfo.bankName }}</div>
                </div>
                <div class="form-group">
                    <label for="bankNumber" class="form-label">Bank Number*</label>
                    <input 
                        id="bankNumber" 
                        v-model="policyData.paymentInfo.bankNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.bankNumber') }" 
                        placeholder="Bank Number"
                        @blur="markFieldAsTouched('paymentInfo.bankNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.bankNumber')" class="error-message">{{ validationErrors.paymentInfo.bankNumber }}</div>
                </div>
                <div class="form-group">
                    <label for="branchNumber" class="form-label">Branch Number*</label>
                    <input 
                        id="branchNumber" 
                        v-model="policyData.paymentInfo.branchNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.branchNumber') }" 
                        placeholder="Branch Number"
                        @blur="markFieldAsTouched('paymentInfo.branchNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.branchNumber')" class="error-message">{{ validationErrors.paymentInfo.branchNumber }}</div>
                </div>
                <div class="form-group">
                    <label for="accountNumber" class="form-label">Account Number*</label>
                    <input 
                        id="accountNumber" 
                        v-model="policyData.paymentInfo.accountNumber" 
                        type="text" 
                        class="form-input" 
                        :class="{ 'error': shouldShowError('paymentInfo.accountNumber') }" 
                        placeholder="Account Number"
                        @blur="markFieldAsTouched('paymentInfo.accountNumber')"
                    />
                    <div v-if="shouldShowError('paymentInfo.accountNumber')" class="error-message">{{ validationErrors.paymentInfo.accountNumber }}</div>
                </div>
                <div class="form-group">
                    <label for="bankAddress" class="form-label">Bank Address</label>
                    <input 
                        id="bankAddress" 
                        v-model="policyData.paymentInfo.bankAddress" 
                        type="text" 
                        class="form-input" 
                        placeholder="Bank Address"
                        @blur="markFieldAsTouched('paymentInfo.bankAddress')"
                    />
                </div>
                <div class="form-group">
                    <label for="bankAddress" class="form-label">Monthly Payment Date</label>
                    <input 
                        id="monthlyPaymentDate" 
                        v-model="policyData.paymentInfo.monthlyPaymentDate" 
                        max="28"
                        min="1"
                        type="number"
                        class="form-input" 
                        placeholder="Monthly Payment Date"
                        @blur="markFieldAsTouched('paymentInfo.monthlyPaymentDate')"
                    />
                </div>
            </div>

            <div class="pfa-terms-section">
                <h3 class="pfa-title">Payment Terms</h3>
                <div class="pfa-options">
                    <div 
                        v-for="term in getPFATerms()" 
                        :key="term.months"
                        class="pfa-option"
                        :class="{ 'pfa-selected': policyData.paymentInfo.PFATerm === term.months }"
                        @click="policyData.paymentInfo.PFATerm = term.months"
                    >
                        <input 
                            type="radio" 
                            :id="'pfa-' + term.months"
                            :value="term.months"
                            v-model="policyData.paymentInfo.PFATerm"
                            name="PFATerm"
                            class="pfa-radio"
                        >
                        <label :for="'pfa-' + term.months" class="pfa-label">
                            <span class="pfa-months">{{ term.months }} Payments:</span>
                            <span class="pfa-price">${{ term.price }}</span>
                        </label>
                    </div>
                </div>
            </div>
            
        </div>
    </div>

    <div class="step-content">
        <div class="step-panel">
            <h2 class="step-heading">Agent Information</h2>
            <div class="form-grid">
                <div class="dealership-selector">
                    <select v-model="managementStore.selectedDealership" class="dealership-dropdown">      
                    <option v-for="dealership in managementStore.dealerships" :key="dealership.id" :value="dealership">
                        {{ dealership.name }}
                    </option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="dealerReference" class="form-label">Dealer Reference</label>
                        <input 
                            id="dealerReference" 
                            v-model="policyData.paymentInfo.dealerReference" 
                            type="text" 
                            class="form-input"  
                            placeholder="Dealer Reference"
                        />
                    </div>
                    <div class="form-group">
                        <label for="dealerFinanceReference" class="form-label">Dealer Finance Reference</label>
                        <input 
                            id="dealerFinanceReference" 
                            v-model="policyData.paymentInfo.dealerFinanceReference" 
                            type="text" 
                            class="form-input"  
                            placeholder="Dealer Finance Reference"
                        />
                    </div>
                </div>
                
            </div>
        </div>
    </div>


</template>

<script setup lang="ts">
import { onMounted } from 'vue'
// This component receives props from the parent PolicyCreation component
import { useManagementStore } from '../../stores/management'
import ProvinceSelect  from '../../components/molecules/ProvinceSelect.vue'
const managementStore = useManagementStore()

onMounted(async () => {
    await managementStore.initializeDealerships()
})

const props = defineProps<{
  policyData: any
  validationErrors: any
  touchedFields: any
  markFieldAsTouched: (path: string) => void
  shouldShowError: (path: string) => boolean
}>()

const getPFATerms = () => {
    const maxTerm = Math.min(props.policyData.selectedProducts[0].productTerm - 12, 48)
    const terms = []
    const productPrice = parseFloat(props.policyData.selectedProducts[0].price) + parseFloat(props.policyData.selectedProducts[1].price)
    for (let months = 12; months <= maxTerm; months += 12) {
        const price = ((0.0995/12 * ((productPrice) * Math.pow(1 + 0.0995/12, -months))) / (1 - Math.pow(1 + 0.0995/12, -months))).toFixed(2)
        //(monthlyRate * (principal - residual * Math.pow(1 + monthlyRate, -term))) / (1 - Math.pow(1 + monthlyRate, -term))
        terms.push({ months, price })
    }
    
    return terms
}

</script>

<script lang="ts">
export default {
  name: 'PCSection3'
}
</script>

<style src="./section-shared.css"></style>
<style scoped>
.section-heading {
  grid-column: 1 / -1;
  font-size: 1.10rem;
  font-weight: 600;
  color: #1f2937;
  margin: 1.5rem 0 1rem 0;
}

/* Error styling */
.form-input.error,
.form-textarea.error {
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

.radio-group {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  transition: all 0.2s;
  flex: 1;
  padding-bottom: 2rem;
}

.radio-option:hover {
  border-color: #2A525A;
}

.radio-option input[type="radio"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.radio-option label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.pfa-terms-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.pfa-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.pfa-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pfa-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pfa-option:hover {
  border-color: #2A525A;
}

.pfa-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.pfa-radio {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.pfa-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.pfa-months {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.pfa-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2A525A;
}

.step-panel {
  min-height: 100px;
}
</style>
