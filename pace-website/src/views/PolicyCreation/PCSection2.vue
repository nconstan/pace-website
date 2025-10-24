<template>
  <div class="step-panel">
    <h2 class="step-heading">Policy Details</h2>
    <div class="product-cards-container">
      <div 
        v-for="product in pricingData.products" 
        :key="product.productName"
        class="product-card" 
        :class="{ 'product-selected': policyData.selectedProducts[0].productName === product.productName  || policyData.selectedProducts[1].productName === product.productName }"
      >
        <div class="product-header">
          <h3 class="product-title">{{ getProductDisplayName(product.productName) }}</h3>
        </div>
        
        <div class="product-content">
          <div class="term-selection">
            <h4 class="term-title">Select Term and Price:</h4>
            <div class="term-options">
              <label
                 v-for="priceOption in product.priceAtMonth" 
                 :key="priceOption.month"
                 class="term-option"
                 :class="{ 'term-selected': productSelected(product.productName, priceOption.month) }"
                 
               >
                <input
                   type="radio"
                   :name="product.productName"
                   :value="priceOption.month"
                   class="term-radio"
                   @click="selectProductAndTerm(product.productName, priceOption.month, priceOption.price)"
                 />
                <div class="term-info">
                  <span class="term-label">{{ priceOption.month }} months</span>
                  <span class="term-price">${{ priceOption.price.toFixed(2) }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method Card -->
      <div class="payment-method-card">
        <h3 class="payment-title">Policy Payment Method</h3>
        <div class="payment-options">
          <label class="payment-option">
            <input
              v-model="policyData.paymentInfo.paymentMethod"
              type="radio"
              value="vehicle-financing"
              class="payment-radio"
            />
            <span class="payment-label">Add to Vehicle Financing</span>
          </label>
          
          <label class="payment-option">
            <input
              v-model="policyData.paymentInfo.paymentMethod"
              type="radio"
              value="credit-card"
              class="payment-radio"
            />
            <span class="payment-label">Credit Card</span>
          </label>
          
          <label class="payment-option">
            <input
              v-model="policyData.paymentInfo.paymentMethod"
              type="radio"
              value="policy-financing"
              class="payment-radio"
            />
            <span class="payment-label">Policy Financing</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { products } from '../../Mixins/constants';
import type { productPriceDetail } from '../PolicyCreation/PolicyCreation.vue';

// This component receives props from the parent PolicyCreation component
const props = defineProps<{
  policyData: any
  validationErrors: any
  touchedFields: any
  markFieldAsTouched: (path: string) => void
  shouldShowError: (path: string) => boolean
  pricingData: { products: productPriceDetail[] }
}>()



// Function to get the product type (primary or secondary)
const getProductType = (productName: string) => {
  const product = products[productName as keyof typeof products]
  return (product as any)?.type || 'primary'
}

// Function to select a product and term
const selectProductAndTerm = (productName: string, term: number, price: number) => {
  let index = getProductType(productName) === 'primary' ? 0 : 1
  if(props.policyData.selectedProducts[index].productName === productName && props.policyData.selectedProducts[index].productTerm === term.toString()){
    props.policyData.selectedProducts[index].productName = ''
    props.policyData.selectedProducts[index].price = 0
    props.policyData.selectedProducts[index].productTerm = ''
    return
  }
  props.policyData.selectedProducts[index].productName = productName
  props.policyData.selectedProducts[index].price = price
  if(index === 0) props.policyData.selectedProducts[index].productTerm = term.toString()
  else props.policyData.selectedProducts[1].productTerm = props.policyData.selectedProducts[0].productTerm
  if(index === 0 && props.policyData.selectedProducts[1].productName !== ''){
    props.policyData.selectedProducts[1].productTerm = props.policyData.selectedProducts[0].productTerm
    props.policyData.selectedProducts[1].price = props.pricingData.products.find((p: any) => p.productName === props.policyData.selectedProducts[1].productName)?.priceAtMonth.find((p: any) => p.month === term)?.price || 0
  } 
  
  // Force reactivity by triggering a change
  props.policyData.selectedProducts = [...props.policyData.selectedProducts]
}

// Function to get product display name
const getProductDisplayName = (productName: string) => {
  return products[productName as keyof typeof products].fullName || productName
}

const productSelected = (productName: string, term: number) => {
  if(getProductType(productName) === 'primary'){
    return props.policyData.selectedProducts[0].productName === productName && props.policyData.selectedProducts[0].productTerm === term.toString()
  } else {
    return props.policyData.selectedProducts[1].productName === productName && props.policyData.selectedProducts[0].productTerm === term.toString()
  }
}

</script>

<script lang="ts">
export default {
  name: 'PCSection2'
}
</script>

<style src="./section-shared.css"></style>
<style scoped>
.product-cards-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.product-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
  transition: all 0.2s;
}

.product-card:hover {
  border-color: #2A525A;
}

.product-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.05);
}

.product-header {
  margin-bottom: 1.5rem;
}

.product-radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.product-radio {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.product-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.term-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.term-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.term-options {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.term-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  flex-shrink: 0;
}

.term-option:hover {
  border-color: #2A525A;
}

.term-selected {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.term-radio {
  display: none;
}

.term-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.term-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.term-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2A525A;
}

.custom-term {
  margin-top: 0.5rem;
}

.custom-term-input {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  width: 150px;
}

.gap-topup-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.gap-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.gap-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.gap-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.gap-terms {
  margin-top: 1rem;
}

.gap-term-grid {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.gap-term-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  min-width: 100px;
  flex-shrink: 0;
}

.gap-term-highlighted {
  border-color: #2A525A;
  background: rgba(255, 242, 0, 0.1);
}

.gap-term-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.gap-term-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2A525A;
}

.payment-method-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
  margin-bottom: 1rem;
}

.payment-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option:hover {
  border-color: #2A525A;
}

.payment-radio {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #ffa242;
}

.payment-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

@media (max-width: 768px) {
  .term-options {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .gap-term-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
