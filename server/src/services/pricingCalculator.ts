import express, { Request, Response, Router } from 'express';
import prisma from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import depreciationData from '../config/depreciationValues.json' with { type: 'json' };
import { getVehicleInfo } from './vinLookup.js';

const router: Router = express.Router();

interface VehicleInfo {
  make: string;
  model: string;
  series: string;
  body: string;
  year: number;
  modelYear: number;
  msrp: number;
  powertrain: string;
  gvwr?: number;
  horsepower?: number;
}

interface ProvinceFactor {
    province: string;
    provinceCode: string;
    rate: number;
    IPTRate: number;
    RSTRate: number;
}

interface InputData {
  isOrganization: boolean;
  applicant1FirstName: string;
  applicant1LastName?: string;
  primaryContact?: string;
  postalCode: string;
  vin: string;
  odometer: number;
  vehiclePurchaseMethod: 'financed' | 'lease' | 'cash';
  vehiclePurchasePrice: number;
  totalDebt?: number;
  debtInterestRate?: number;
  debtTerm?: number;
  debtLoanPayment?: number;
  debtResidualValue?: number;
  cashDeposit?: number;
  rolledInNegativeEquity?: number;
  valueAppreciationRate?: number;
  product: string;
  policyTerm: number;
  calendarYear: number;
  dealershipLicensed?: boolean;
  isTransfer?: boolean;
  transferFromPolicyNumber?: string;
  transferCredit?: number;
}

interface InputData2 {  
  postalCode: string;
  vin: string;
  odometer: number;
  vehiclePurchaseMethod: 'financed' | 'lease' | 'cash';
  vehiclePurchasePrice: number;
  totalDebt?: number;
  debtInterestRate?: number;
  debtTerm?: number;
  debtLoanPayment?: number;
  debtResidualValue?: number;
  cashDeposit?: number;
  rolledInNegativeEquity?: number;
  valueAppreciationRate?: number;
  products: string[];
  policyTerm: number | null;
  calendarYear: number;
  dealershipLicensed?: boolean;
  isTransfer?: boolean;
  transferFromPolicyNumber?: string;
  transferCredit?: number;
}

interface VinData {
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  modelYear: number;
  combinedMSRP: number;
  powertrain: string; // e.g., 'Combustion', 'Electric'
  gvwr?: number;
  horsepower?: number;
}

// Refund Input
interface RefundInput {
  policyNumber: string;
  cancelationOrTransfer: 'Cancelation' | 'Transfer';
  cancelationDate: Date;
  minimumRetained?: boolean;
  cancelationFee?: number;
  transferFee?: number;
}

// Policy Data (dummy fetch type)
interface PolicyData {
  effectiveDate: Date;
  term: number;
  provinceCode: string;
  products: Array<{
    product: string;
    underwritingPremium: number;
    mgaPayment: number;
    sellerCommission: number;
    ipt: number;
    referralPayment: number;
    administrationFee: number;
    retailTax: number;
    retailPrice: number;
  }>;
}

// Dummy VIN Table
const dummyVinTable: Record<string, VehicleInfo> = {
    '1GCEC19T5XZ130295': {make:'Chevrolet', model:'Camaro', series:'ZL1', body:'Coupe', year:2024, modelYear:2024, msrp:60000, powertrain:'V8', gvwr: 5000, horsepower: 650},
    '2GCEC19T5XZ130291': {make:'Toyota', model:'Camry', series:'XLE', body:'Sedan', year:2024, modelYear:2024, msrp:30000, powertrain:'V6', gvwr: 3500, horsepower: 200},
    '3GCEC19T5XZ130292': {make:'Ford', model:'F-150', series:'Lariat', body:'Truck', year:2024, modelYear:2024, msrp:50000, powertrain:'V8', gvwr: 8000, horsepower: 400},
    '4GCEC19T5XZ130293': {make:'Honda', model:'Civic', series:'EX', body:'Sedan', year:2024, modelYear:2024, msrp:25000, powertrain:'V6', gvwr: 3000, horsepower: 180},
    '5GCEC19T5XZ130294': {make:'Nissan', model:'Altima', series:'SV', body:'Sedan', year:2024, modelYear:2024, msrp:20000, powertrain:'V6', gvwr: 3000, horsepower: 180},
    '6GCEC19T5XZ130295': {make:'Hyundai', model:'Elantra', series:'SE', body:'Sedan', year:2024, modelYear:2024, msrp:20000, powertrain:'V6', gvwr: 3000, horsepower: 180},
    '7GCEC19T5XZ130296': {make:'Kia', model:'Sorento', series:'SX', body:'SUV', year:2024, modelYear:2024, msrp:30000, powertrain:'V6', gvwr: 5000, horsepower: 250},
    '8GCEC19T5XZ130297': {make:'Mazda', model:'CX-5', series:'Grand Touring', body:'SUV', year:2024, modelYear:2024, msrp:35000, powertrain:'V6', gvwr: 5000, horsepower: 250},
};

// Dummy Vehicle Category Table
const dummyVehicleCategoryTable: Record<string, {zone: string, rate: number}> = {
    '1': {zone:'Zone 1', rate:1},
    '2': {zone:'Zone 2', rate:1.1},
    '3': {zone:'Zone 3', rate:1.2},
    '4': {zone:'Zone 4', rate:1.3},
    '5': {zone:'Zone 5', rate:1.4},
    '6': {zone:'Zone 6', rate:1.5},
    '999': {zone:'Excluded', rate:0},
};

// Dummy Geographic Zone Table
const dummyGeographicZoneTable: Record<string, {zone: string, rate: number}> = {
    '1': {zone:'Zone 1', rate:1},
    '2': {zone:'Zone 2', rate:0.8},
    '3': {zone:'Zone 3', rate:0.9},
    '4': {zone:'Zone 4', rate:1.1},
    '5': {zone:'Zone 5', rate:1.2},
};

// Dummy Province Factor Table
const dummyProvinceFactorTable: Record<string, ProvinceFactor> = {
    'AB': {province:'Alberta', provinceCode:'AB', rate:1, IPTRate:4.0, RSTRate:0},
    'BC': {province:'British Columbia', provinceCode:'BC', rate:1, IPTRate:4.4, RSTRate:0},
    'MB': {province:'Manitoba', provinceCode:'MB', rate:1, IPTRate:3.0, RSTRate:8.0},
    'NB': {province:'New Brunswick', provinceCode:'NB', rate:1, IPTRate:4.0, RSTRate:0},
    'NL': {province:'Newfoundland and Labrador', provinceCode:'NL', rate:1, IPTRate:5.0, RSTRate:15.0},
    'NT': {province:'Northwest Territories', provinceCode:'NT', rate:1, IPTRate:3.0, RSTRate:0},
    'NS': {province:'Nova Scotia', provinceCode:'NS', rate:1, IPTRate:4.0, RSTRate:0},
    'NU': {province:'Nunavut', provinceCode:'NU', rate:1, IPTRate:2.0, RSTRate:0},
    'ON': {province:'Ontario', provinceCode:'ON', rate:1, IPTRate:3.5, RSTRate:8.0},
    'PE': {province:'Prince Edward Island', provinceCode:'PE', rate:1, IPTRate:3.5, RSTRate:0},
    'QC': {province:'Quebec', provinceCode:'QC', rate:1.3, IPTRate:3.48, RSTRate:9.0},
    'SK': {province:'Saskatchewan', provinceCode:'SK', rate:1, IPTRate:4.0, RSTRate:6.0},
    'YT': {province:'Yukon', provinceCode:'YT', rate:1, IPTRate:2.0, RSTRate:0},
};

// Dummy Used Vehicle Model Year Factor Table
const dummyUsedVehicleModelYearFactorTable: Record<string, {rate: number}> = {
    '+1': { rate:1},
    '0':  { rate:1},
    '-1': { rate:1},
    '-2': { rate:1},
    '-3': { rate:1},
    '-4': { rate:1},
    '-5': { rate:1},
    '-6': { rate:1.1},
    '-7': { rate:1.2},
    '-8': { rate:1.3},
    '-9': { rate:1.4},
    '-10': { rate:1.5},
};

// Dummy New Vehicle Model Year Factor Table
const dummyNewVehicleModelYearFactorTable: Record<string, {rate: number}> = {
    '+1': { rate:1},
    '0':  { rate:1},
    '-1': { rate:1.2},
};

// Per-product tables
const underwriterMargins: Record<string, number> = {
  'RCP': 0.25, 'RCE': 0.25, 'RCD': 0.25, 'RCC': 0.25, 'RCA': 0.25, 'GTU': 0.25, 'RNE': 0.25
};

const frequenciesAnnual: Record<string, number> = {
  'RCP': 0.005, 'RCE': 0.005, 'RCD': 0.005, 'RCC': 0.005, 'RCA': 0.005, 'GTU': 0.006, 'RNE': 0.006
};

const sellerCommissionRates: Record<string, number> = {
  'RCP': 0.35, 'RCE': 0.35, 'RCD': 0.35, 'RCC': 0.35, 'RCA': 0.35, 'GTU': 0.35, 'RNE': 0.35
};

const referralPaymentRates: Record<string, number> = {
  'RCP': 0.35, 'RCE': 0.35, 'RCD': 0.35, 'RCC': 0.35, 'RCA': 0.35, 'GTU': 0.35, 'RNE': 0.35
};

// Min Underwriting per product
const minUnderwritingTable: Record<string, {from: number, to: number, premium: number}[]> = {
  'RCP': [
      {from: 0, to: 35, premium: 200},
      {from: 36, to: 47, premium: 200},
      {from: 48, to: 59, premium: 300},
      {from: 60, to: Infinity, premium: 425}
  ],
  'RCE': [
      {from: 0, to: 35, premium: 50},
      {from: 36, to: 47, premium: 50},
      {from: 48, to: 59, premium: 75},
      {from: 60, to: Infinity, premium: 100}
  ],
  'RCD': [
      {from: 0, to: 35, premium: 50},
      {from: 36, to: 47, premium: 50},
      {from: 48, to: 59, premium: 75},
      {from: 60, to: Infinity, premium: 100}
  ],
  'RCC': [
      {from: 0, to: 35, premium: 200},
      {from: 36, to: 47, premium: 200},
      {from: 48, to: 59, premium: 300},
      {from: 60, to: Infinity, premium: 425}
  ],
  'RCA': [
      {from: 0, to: 35, premium: 50},
      {from: 36, to: 47, premium: 50},
      {from: 48, to: 59, premium: 75},
      {from: 60, to: Infinity, premium: 100}
  ],
  'GTU': [
      {from: 0, to: 35, premium: 50},
      {from: 36, to: 47, premium: 50},
      {from: 48, to: 59, premium: 75},
      {from: 60, to: Infinity, premium: 100}
  ],
  'RNE': [
      {from: 0, to: 35, premium: 50},
      {from: 36, to: 47, premium: 50},
      {from: 48, to: 59, premium: 50},
      {from: 60, to: Infinity, premium: 50}
  ]
};

// Min Referral Payment per product
const minReferralTable: Record<string, {from: number, to: number, payment: number}[]> = {
  'RCP': [
      {from: 0, to: 35, payment: 350},
      {from: 36, to: 47, payment: 450},
      {from: 48, to: 59, payment: 650},
      {from: 60, to: Infinity, payment: 750}
  ],
  'RCE': [
      {from: 0, to: 35, payment: 50},
      {from: 36, to: 47, payment: 50},
      {from: 48, to: 59, payment: 75},
      {from: 60, to: Infinity, payment: 100}
  ],
  'RCD': [
      {from: 0, to: 35, payment: 50},
      {from: 36, to: 47, payment: 50},
      {from: 48, to: 59, payment: 75},
      {from: 60, to: Infinity, payment: 100}
  ],
  'RCC': [
      {from: 0, to: 35, payment: 350},
      {from: 36, to: 47, payment: 450},
      {from: 48, to: 59, payment: 650},
      {from: 60, to: Infinity, payment: 750}
  ],
  'RCA': [
      {from: 0, to: 35, payment: 50},
      {from: 36, to: 47, payment: 50},
      {from: 48, to: 59, payment: 75},
      {from: 60, to: Infinity, payment: 100}
  ],
  'GTU': [
      {from: 0, to: 35, payment: 50},
      {from: 36, to: 47, payment: 50},
      {from: 48, to: 59, payment: 75},
      {from: 60, to: Infinity, payment: 100}
  ],
  'RNE': [
      {from: 0, to: 35, payment: 50},
      {from: 36, to: 47, payment: 50},
      {from: 48, to: 59, payment: 75},
      {from: 60, to: Infinity, payment: 100}
  ]
};

// GST Rate
const gstRate = 0.05;

// Province Code Table
const provinceCodeTable: Record<string, string> = {
  'A': 'NL', 'B': 'NS', 'C': 'PE', 'E': 'NB', 'G': 'QC', 'H': 'QC', 'J': 'QC',
  'K': 'ON', 'L': 'ON', 'M': 'ON', 'N': 'ON', 'P': 'ON', 'R': 'MB', 'S': 'SK',
  'T': 'AB', 'V': 'BC', 'X': 'NT', 'Y': 'YT' // NV as NT, but doc clarifies NU/NT split
};

// Functions
function getMinUnderwriting(product: string, term: number): number {
  const ranges = minUnderwritingTable[product] || minUnderwritingTable['RCP'];
  const range = ranges.find(r => term >= r.from && term <= r.to);
  return range?.premium || 425;
}

function getMinReferral(product: string, term: number): number {
  const ranges = minReferralTable[product] || minReferralTable['RCP'];
  const range = ranges.find(r => term >= r.from && term <= r.to);
  return range?.payment || 750;
}

function getMinDealershipReferral(term: number): number {
  if (term <= 35) return 300;
  if (term <= 47) return 400;
  if (term <= 59) return 600;
  return 700;
}

function getIsLicensedSeller(dealership: string): boolean {
  return Math.random() > 0.5;
}

function getVehicleState(modelYear: number, odometer: number, calendarYear: number): string {
  if (modelYear <= 0) return "Error";
  if (odometer <= 25000 && modelYear > calendarYear - 2) return "New";
  if (modelYear > calendarYear - 11) return "Used";
  return "Not Covered";
}

function getModelYearFactor(state: string, modelYear: number, calendarYear: number): number {
  const age = calendarYear - modelYear;
  if (state === 'New') {
    if (age <= 0) return 1;
    if (age === 1) return 1.2;
    return Infinity;
  } else if (state === 'Used') {
    if (age <= 5) return 1;
    return 1 + (age - 5) * 0.1; // Up to 1.5 at age 10
  }
  return 1;
}

function getZone(postalCode: string): string {
  return '1'; // Dummy
}

function getZoneFactor(zone: string): number {
  return dummyGeographicZoneTable[zone]?.rate || 1;
}

function getProvincialFactor(provinceCode: string): number {
  return dummyProvinceFactorTable[provinceCode]?.rate || 1;
}

function getVehicleCategoryFactor(make: string, model: string): number {
  return dummyVehicleCategoryTable['1'].rate; // Dummy
}

function getPowertrainFactor(powertrain: string): number {
  return powertrain === 'Electric' ? 1.2 : 1;
}

function getMGAAdjustment(): number {
  return 0;
}

function getCommissionAdjustment(): number {
  return 0;
}

function getReferralAdjustment(): number {
  return 0;
}

function getAdminFee(): number {
  return 0;
}
async function vinLookup(vin: string): Promise<VinData> {
  const info = await getVehicleInfo(vin);  
  if (!info) throw new Error('Invalid VIN');
  return {
    make: info.make,
    model: info.model,
    trim: info.series,
    bodyStyle: info.body,
    modelYear: info.modelYear,
    combinedMSRP: info.combinedMSRP,
    powertrain: info.powertrain,
    gvwr: Number(info.weight),
    horsepower: info.horsepower
  };
}

function getDepreciationValue(make: string, month: number): number {
  const monthEntry = depreciationData.find((entry: any) => entry.Month === month);
  if (!monthEntry) return 0;
  return (monthEntry[make as keyof typeof monthEntry] as number) || (monthEntry.default as number);
}

function getProvinceFromPostal(postalCode: string): string {
  const firstChar = postalCode[0].toUpperCase();
  return provinceCodeTable[firstChar];
}

function calculatePMT(rate: number, term: number, principal: number, residual: number = 0): number {
  const monthlyRate = rate / 12;
  if (monthlyRate === 0) return (principal - residual) / term;
  return (monthlyRate * (principal - residual * Math.pow(1 + monthlyRate, -term))) / (1 - Math.pow(1 + monthlyRate, -term));
}


async function calculatePricing2(input: InputData2): Promise<{ retailPriceAfterTax: number; details: any}> {
  const calendarYear = input.calendarYear;
  const vinData = await vinLookup(input.vin);
  const province = getProvinceFromPostal(input.postalCode);
  const iptRate = dummyProvinceFactorTable[province]?.IPTRate / 100 || 0;
  const rstRate = dummyProvinceFactorTable[province]?.RSTRate / 100 || 0;
  const vehicleValue = vinData.combinedMSRP;
  //TODO Will need to re-implement when when we have blackbook
  //if (Math.abs(input.vehiclePurchasePrice - vehicleValue) / vehicleValue > 0.1) throw new Error('Price validation failed');

  if (vinData.gvwr && vinData.gvwr > 5000) throw new Error('GVWR exceeds policy limit');

  const horsepowerFactor = (vinData.horsepower && vinData.horsepower > 5000) ? 1.1 : 1;

  const vehicleState = getVehicleState(vinData.modelYear, input.odometer, calendarYear);
  if (vehicleState === 'Error' || vehicleState === 'Not Covered') throw new Error(`Vehicle state: ${vehicleState}`);

  const totalDebt = input.totalDebt || 0;
  const negativeEquity = totalDebt - vehicleValue;
  const negativeEquityRatio = Math.max(totalDebt / vehicleValue - 1, 0);


  const negativeEquityFactor = 1 + Math.pow(Math.max(totalDebt / input.vehiclePurchasePrice, 1) - 1, 1.4);
  const interestRate = input.debtInterestRate!/100 || 0;
  const interestFactor = 1 + ((interestRate ** 2) * 20);
  const modelYearFactor = getModelYearFactor(vehicleState, vinData.modelYear, calendarYear);
  if (modelYearFactor === Infinity) throw new Error('Not Covered');
  const zone = getZone(input.postalCode);
  const zoneFactor = getZoneFactor(zone);
  const provincialFactor = getProvincialFactor(province);
  const vehicleCategoryFactor = getVehicleCategoryFactor(vinData.make, vinData.model);
  const powertrainFactor = getPowertrainFactor(vinData.powertrain);

  if (input.vehiclePurchaseMethod !== 'cash') {
      const estimatedPayment = calculatePMT(interestRate, input.debtTerm!, totalDebt, input.debtResidualValue);
      if (Math.abs(input.debtLoanPayment! - estimatedPayment) / estimatedPayment > 0.1) throw new Error('Loan payment validation failed');
  }

  let productPriceDetails: any = {};
  let months: number[] = input.policyTerm ? [input.policyTerm] : [36, 48, 60, 72, 84, 96];
  let max_term = Math.max(...months);
  const r = interestRate / 12;

  const depFactors = Array.from({length: max_term + 1}, (_, n) => getDepreciationValue(vinData.make, n));
  const appreciationRate = input.valueAppreciationRate || 0;
  const debtTerm = input.debtTerm || max_term; // Use max_term if not provided

  function getLoanBalance(monthsPaid: number): number {
    const remainingMonths = debtTerm - monthsPaid;
    if (remainingMonths <= 0) return 0;
    if (r === 0) return totalDebt * (remainingMonths / debtTerm) + (input.debtResidualValue || 0) * (remainingMonths / debtTerm);
    return (input.debtLoanPayment || 0) * (1 - Math.pow(1 + r, -remainingMonths)) / r + (input.debtResidualValue || 0) * Math.pow(1 + r, -remainingMonths);
  }

  if(input.products.includes('RCP')) {
    productPriceDetails['RCP'] = {baseAvgLossAtTerm: {}}
    let totalLossRCP = 0;
    let cumulativeLoss = 0;
    for(let n = 1; n <= max_term; n++) {
      const monthlyLoss = getLoanBalance(n-1) - getLoanBalance(n);
      totalLossRCP += monthlyLoss;
      cumulativeLoss += totalLossRCP;
      if(months.includes(n)) {
        productPriceDetails['RCP']['baseAvgLossAtTerm'][n] = cumulativeLoss / n;
      }
    }
  }
  if(input.products.includes('RCE')) {
    productPriceDetails['RCE'] = {baseAvgLossAtTerm: {}}
    months.forEach(month => {
      productPriceDetails['RCE']['baseAvgLossAtTerm'][month] = (month + 1) * (input.debtLoanPayment || 0) / 2;
    });
  }
  if(input.products.includes('RCD')) {
    productPriceDetails['RCD'] = {baseAvgLossAtTerm: {}}
    months.forEach(month => {
      productPriceDetails['RCD']['baseAvgLossAtTerm'][month] = (month + 1) * (totalDebt / debtTerm) / 2; // placeholder
    });
  }
  if(input.products.includes('RCC')) {
    productPriceDetails['RCC'] = {baseAvgLossAtTerm: {}}
    let totalLossRCC = 0;
    for(let n = 0; n <= max_term; n++) {
      const monthlyLoss = vehicleValue * (1 - depFactors[n]);
      totalLossRCC += monthlyLoss;
      if(months.includes(n)) {
        productPriceDetails['RCC']['baseAvgLossAtTerm'][n] = totalLossRCC / n;
      }
    }
  }
  if(input.products.includes('RCA')) {
    productPriceDetails['RCA'] = {baseAvgLossAtTerm: {}}
    let totalLossRCA = 0;
    for(let n = 0; n <= max_term; n++) {
      const appreciatedValue = vehicleValue * Math.pow(1 + appreciationRate, n / 12); // Annual to monthly
      const monthlyLoss = appreciatedValue * (1 - depFactors[n]);
      totalLossRCA += monthlyLoss;
      if(months.includes(n)) {
        productPriceDetails['RCA']['baseAvgLossAtTerm'][n] = totalLossRCA / n;
      }
    }
  }
  if(input.products.includes('GTU')) {
    productPriceDetails['GTU'] = {baseAvgLossAtTerm: {}}
    let totalLossGTU = 0;
    for(let n = 0; n <= max_term; n++) {
      let loanBalance: number;
      if(r === 0) {
        loanBalance = totalDebt - (input.debtLoanPayment! * n);
      } else {
        loanBalance = totalDebt * Math.pow(1 + r, n) - ((input.debtLoanPayment! / r) * (Math.pow(1 + r, n) - 1));
      }
      const depValue = vehicleValue * depFactors[n];
      const monthlyLoss = Math.max(loanBalance - depValue, 0);
      totalLossGTU += monthlyLoss;
      if(months.includes(n)) {
        productPriceDetails['GTU']['baseAvgLossAtTerm'][n] = totalLossGTU / n;
      }
    }
  }
  if(input.products.includes('RNE')) {
    productPriceDetails['RNE'] = {baseAvgLossAtTerm: {}}
    let negativeEquityMonthlyPayment: number;
    if(interestRate === 0) {
      negativeEquityMonthlyPayment = input.rolledInNegativeEquity! / debtTerm;
    } else {
      negativeEquityMonthlyPayment = (input.rolledInNegativeEquity! * r * Math.pow(1 + r, debtTerm)) / (Math.pow(1 + r, debtTerm) - 1);
    }
    let totalLossRNE = 0;
    for(let n = 0; n <= max_term; n++) {
      let loanBalance: number;
      if(interestRate === 0) {
        loanBalance = input.rolledInNegativeEquity! - (negativeEquityMonthlyPayment * n);
      } else {
        loanBalance = input.rolledInNegativeEquity! * Math.pow(1 + r, n) - ((negativeEquityMonthlyPayment / r) * (Math.pow(1 + r, n) - 1));
      }
      totalLossRNE += Math.max(loanBalance, 0);
      if(months.includes(n)) {
        productPriceDetails['RNE']['baseAvgLossAtTerm'][n] = totalLossRNE / (n);
      }
    }
  }

  input.products.forEach(product => {
    for (const term of months) {
      const baseAvgLoss = productPriceDetails[product]['baseAvgLossAtTerm'][term];
      const avgLossAmount = baseAvgLoss + (0.004 * baseAvgLoss) + 250;
      const frequency = (term / 12) * frequenciesAnnual[product];
      const burnCost = avgLossAmount * frequency;
      const underwriterMargin = underwriterMargins[product];
      const minUnderwriting = getMinUnderwriting(product, term);
      let baseUnderwritingPremium = Math.max(minUnderwriting, burnCost / (1 - underwriterMargin));
      let increments = [
          (negativeEquityFactor - 1) * baseUnderwritingPremium,
          (interestFactor - 1) * baseUnderwritingPremium,
          (modelYearFactor - 1) * baseUnderwritingPremium,
          (zoneFactor - 1) * baseUnderwritingPremium,
          (provincialFactor - 1) * baseUnderwritingPremium,
          (vehicleCategoryFactor - 1) * baseUnderwritingPremium,
          (powertrainFactor - 1) * baseUnderwritingPremium,
          (horsepowerFactor - 1) * baseUnderwritingPremium
      ].reduce((sum, inc) => sum + inc, 0);

      const underwritingPremium = Number((baseUnderwritingPremium + increments).toFixed(2));

      const mgaPayment = Number((underwritingPremium + getMGAAdjustment()).toFixed(2));

      const isCommissionedSale = input.dealershipLicensed ?? true;
      const sellerCommissionRate = sellerCommissionRates[product];
      let sellerCommission = 0;
      let referralPayment = 0;

      if (isCommissionedSale) {
          const baseSellerCommission = (underwritingPremium + mgaPayment) * sellerCommissionRate / (1 - iptRate) / (1 - (sellerCommissionRate / (1 - iptRate)));
          sellerCommission = Number((baseSellerCommission + getCommissionAdjustment()).toFixed(2));
      }

      const ipt = Number((((underwritingPremium + sellerCommission + mgaPayment) * iptRate) / (1 - iptRate)).toFixed(2));

      const insurancePremium = underwritingPremium + mgaPayment + sellerCommission + ipt;

      if (!isCommissionedSale) {
          const referralRate = referralPaymentRates[product];
          const baseReferralInclGST = Math.max(getMinReferral(product, term), (insurancePremium / (1 - referralRate)) - insurancePremium);
          const dealershipReferralFee = getMinDealershipReferral(term);
          const dealershipReferralFeeGST = dealershipReferralFee - (dealershipReferralFee / (1 + gstRate));
          const dealerGroupReferralFee = baseReferralInclGST - dealershipReferralFee;
          const dealerGroupReferralFeeGST = dealerGroupReferralFee - (dealerGroupReferralFee / (1 + gstRate));
          referralPayment = Number((baseReferralInclGST + getReferralAdjustment()).toFixed(2));
      }

      const adminFee = getAdminFee();

      

      const retailBeforeTax = insurancePremium + referralPayment + adminFee
      const retailTax = retailBeforeTax * rstRate;
      const retailPriceAfterTax = Number((retailBeforeTax + retailTax).toFixed(2));

      if (!productPriceDetails[product]['pricing']) productPriceDetails[product]['pricing'] = {};
      productPriceDetails[product]['pricing'][term] = {
          retailPriceAfterTax,
          details: {
              underwritingPremium,
              mgaPayment,
              sellerCommission,
              ipt,
              insurancePremium,
              referralPayment,
              adminFee,
              retailBeforeTax,
              retailTax,
              retailPriceAfterTax
          }
      };
    }
  });

  return productPriceDetails;
}

function calculateRefund(input: RefundInput, policyData: PolicyData): Record<string, { refund: number; details: any }> {
  const productRefundDetails: Record<string, { refund: number; details: any }> = {};

  policyData.products.forEach((prodData) => {
    const product = prodData.product;

    const policyExpiry = new Date(policyData.effectiveDate);
    policyExpiry.setMonth(policyExpiry.getMonth() + policyData.term);

    const daysSinceEffective = (input.cancelationDate.getTime() - policyData.effectiveDate.getTime()) / (1000 * 86400); // Corrected: seconds in day
    const fullRefund = daysSinceEffective <= 30;

    // Use YEARFRAC approximation: months remaining = (expiry - cancel) / avg month days * 12 / 12, but trunc full months
    const remainingDays = (policyExpiry.getTime() - input.cancelationDate.getTime()) / (1000 * 86400);
    const remainingMonths = Math.trunc(remainingDays / 30); // Approx as per doc's TRUNC

    const refundFactor = (remainingMonths * (remainingMonths + 1)) / (policyData.term * (policyData.term + 1));

    const retailTaxRefundRate = prodData.retailTax / prodData.retailPrice;

    let underwritingRefund, mgaRefund, sellerRefund, iptRefund, referralRefund, administrationRefund, retailTaxRefund, fee;

    if (fullRefund || ['GTU', 'RNE'].includes(product)) {
      if (!fullRefund && ['GTU', 'RNE'].includes(product)) {
        productRefundDetails[product] = { refund: 0, details: { message: 'No refund for GTU/RNE' } };
        return; // Skip to next product
      }
      underwritingRefund = prodData.underwritingPremium;
      mgaRefund = prodData.mgaPayment;
      sellerRefund = prodData.sellerCommission;
      iptRefund = prodData.ipt;
      referralRefund = prodData.referralPayment;
      administrationRefund = prodData.administrationFee; // Full refund includes admin?
      retailTaxRefund = prodData.retailTax;
      fee = 0;
    } else {
      underwritingRefund = prodData.underwritingPremium * refundFactor;
      mgaRefund = prodData.mgaPayment * refundFactor;
      sellerRefund = prodData.sellerCommission * refundFactor;
      iptRefund = prodData.ipt * refundFactor;
      referralRefund = input.minimumRetained ? 0 : prodData.referralPayment * refundFactor;
      administrationRefund = 0; // Non-refundable per doc
      retailTaxRefund = prodData.retailTax * retailTaxRefundRate;
      fee = input.cancelationOrTransfer === 'Cancelation' ? (input.cancelationFee || 100) : (input.transferFee || 50);
    }

    const totalRefund = underwritingRefund + mgaRefund + sellerRefund + iptRefund + referralRefund + administrationRefund + retailTaxRefund - fee;

    productRefundDetails[product] = {
      refund: Number(totalRefund.toFixed(2)),
      details: {
        fullRefund,
        remainingMonths,
        refundFactor,
        underwritingRefund: Number(underwritingRefund.toFixed(2)),
        mgaRefund: Number(mgaRefund.toFixed(2)),
        sellerRefund: Number(sellerRefund.toFixed(2)),
        iptRefund: Number(iptRefund.toFixed(2)),
        referralRefund: Number(referralRefund.toFixed(2)),
        administrationRefund: Number(administrationRefund.toFixed(2)),
        retailTaxRefund: Number(retailTaxRefund.toFixed(2)),
        fee
      }
    };
  });

  return productRefundDetails;
}

export { calculatePricing2, calculateRefund };



// ---------------------- old but accurate pricing calculator ----------------------

// function calculatePricing(input: InputData): { retailPriceAfterTax: number; details: any} {
//   const calendarYear = input.calendarYear;
//   const vinData = mockVinLookup(input.vin);
//   const province = getProvinceFromPostal(input.postalCode);
//   const iptRate = dummyProvinceFactorTable[province]?.IPTRate / 100 || 0;
//   const rstRate = dummyProvinceFactorTable[province]?.RSTRate / 100 || 0;
//   const vehicleValue = vinData.combinedMSRP;
//   if (Math.abs(input.vehiclePurchasePrice - vehicleValue) / vehicleValue > 0.1) throw new Error('Price validation failed');

//   if (vinData.gvwr && vinData.gvwr > 5000) throw new Error('GVWR exceeds policy limit');

//   const horsepowerFactor = (vinData.horsepower && vinData.horsepower > 5000) ? 1.1 : 1;

//   const vehicleState = getVehicleState(vinData.modelYear, input.odometer, calendarYear);
//   if (vehicleState === 'Error' || vehicleState === 'Not Covered') throw new Error(`Vehicle state: ${vehicleState}`);

//   const totalDebt = input.totalDebt || 0;
//   const negativeEquity = totalDebt - vehicleValue;
//   const negativeEquityRatio = Math.max(totalDebt / vehicleValue - 1, 0);


//   const negativeEquityFactor = 1 + Math.pow(Math.max(totalDebt / input.vehiclePurchasePrice, 1) - 1, 1.4);
//   const interestRate = input.debtInterestRate!/100 || 0;
//   const interestFactor = 1 + ((interestRate ** 2) * 20);
//   const modelYearFactor = getModelYearFactor(vehicleState, vinData.modelYear, calendarYear);
//   if (modelYearFactor === Infinity) throw new Error('Not Covered');
//   const zone = getZone(input.postalCode);
//   const zoneFactor = getZoneFactor(zone);
//   const provincialFactor = getProvincialFactor(province);
//   const vehicleCategoryFactor = getVehicleCategoryFactor(vinData.make, vinData.model);
//   const powertrainFactor = getPowertrainFactor(vinData.powertrain);

//   if (input.vehiclePurchaseMethod !== 'cash') {
//       const estimatedPayment = calculatePMT(interestRate, input.debtTerm!, totalDebt, input.debtResidualValue);
//       if (Math.abs(input.debtLoanPayment! - estimatedPayment) / estimatedPayment > 0.1) throw new Error('Loan payment validation failed');
//   }

//   let baseAvgLoss = 0;
//   const term = input.policyTerm;
//   const debtTerm = input.debtTerm;
//   const r = interestRate / 12;
//   const depFactors = Array.from({length: term + 1}, (_, n) => getDepreciationValue(vinData.make, n));
//   const appreciationRate = input.valueAppreciationRate || 0;

//   switch (input.product) {
//       case 'RCP':
//         let totalLossRCP = 0;
//         let cumulativeLoss = 0;
//         for(let n = 1; n <= term; n++) {
//             let currentMonth = totalDebt * Math.pow(1 + r, n-1) - ((input.debtLoanPayment! / r) * (Math.pow(1 + r, n-1) - 1));
//             let nextMonth = totalDebt * Math.pow(1 + r, n) - ((input.debtLoanPayment! / r) * (Math.pow(1 + r, n) - 1));
//             let monthlyLoss = currentMonth - nextMonth;
//             totalLossRCP += monthlyLoss;
//             cumulativeLoss += totalLossRCP;
//           }
//           baseAvgLoss = cumulativeLoss / term;
//           break;
//       case 'RCE':
//           baseAvgLoss = (term + 1) * (input.debtLoanPayment || 0) / 2;
//           break;
//       case 'RCD':
//           baseAvgLoss = (term + 1) * (totalDebt / debtTerm!) / 2; // Placeholder
//           break;
//       case 'RCC':
//           let totalLossRCC = 0;
//           for (let n = 0; n <= term; n++) {
//               totalLossRCC += vehicleValue * (1 - depFactors[n]);
//           }
//           baseAvgLoss = totalLossRCC / term;
//           break;
//       case 'RCA':
//           let totalLossRCA = 0;
//           for (let n = 0; n <= term; n++) {
//               const appreciatedValue = vehicleValue * Math.pow(1 + appreciationRate, n / 12); // Annual to monthly
//               totalLossRCA += appreciatedValue * (1 - depFactors[n]);
//           }
//           baseAvgLoss = totalLossRCA / term;
//           break;
//           case 'GTU':
//             let totalLossGTU = 0;
//             for (let n = 0; n <= term; n++) {
//                 let loanBalance: number;
//                 if (r === 0) {
//                     loanBalance = totalDebt - (input.debtLoanPayment! * n);
//                 } else {
//                     loanBalance = totalDebt * Math.pow(1 + r, n) -
//                         ((input.debtLoanPayment! / r) * (Math.pow(1 + r, n) - 1));
//                 }
//                 const depValue = vehicleValue * depFactors[n];
//                 totalLossGTU += Math.max(loanBalance - depValue, 0);
//             }
//             baseAvgLoss = totalLossGTU / term;
//             break;
//       case 'RNE':
//         let negativeEquityMonthlyPayment: number;
//         if (interestRate === 0) {
//             negativeEquityMonthlyPayment = input.rolledInNegativeEquity! / debtTerm!;
//         } else {
//             negativeEquityMonthlyPayment = (input.rolledInNegativeEquity! * (r) * Math.pow(1 + r, debtTerm!)) / (Math.pow(1 + r, debtTerm!) - 1);
//         }
    
//         let totalLoss = 0;
//         for (let n = 0; n <= term; n++) {
//             let loanBalance: number;
//             if (interestRate === 0) {
//                 loanBalance = input.rolledInNegativeEquity! - (negativeEquityMonthlyPayment * n);
//             } else {
//                 loanBalance = (input.rolledInNegativeEquity! * Math.pow(1 + r, n)) - ((negativeEquityMonthlyPayment / r) * (Math.pow(1 + r, n) - 1));
//             }
//             totalLoss += Math.max(loanBalance, 0); // Prevent negative
//         }
//         baseAvgLoss = totalLoss / term;
//         break;
//       default:
//           throw new Error('Unknown product');
//   }

//   const avgLossAmount = baseAvgLoss + (0.004 * baseAvgLoss) + 250;

//   const frequency = (term / 12) * frequenciesAnnual[input.product];
//   const burnCost = avgLossAmount * frequency;

//   const underwriterMargin = underwriterMargins[input.product];
//   const minUnderwriting = getMinUnderwriting(input.product, term);
//   let baseUnderwritingPremium = Math.max(minUnderwriting, burnCost / (1 - underwriterMargin));

//   const increments = [
//       (negativeEquityFactor - 1),
//       (interestFactor - 1),
//       (modelYearFactor - 1),
//       (zoneFactor - 1),
//       (provincialFactor - 1),
//       (vehicleCategoryFactor - 1),
//       (powertrainFactor - 1),
//       (horsepowerFactor - 1)
//   ].reduce((sum, inc) => sum + inc * baseUnderwritingPremium, 0);

//   const underwritingPremium = Number((baseUnderwritingPremium + increments).toFixed(2));

//   const mgaAdjustment = getMGAAdjustment();
//   const mgaPayment = Number((underwritingPremium + mgaAdjustment).toFixed(2));

//   const isCommissionedSale = input.dealershipLicensed ?? true;
//   const sellerCommissionRate = sellerCommissionRates[input.product];
//   let sellerCommission = 0;
//   let referralPayment = 0;

//   if (isCommissionedSale) {
//       const baseSellerCommission = (underwritingPremium + mgaPayment) * sellerCommissionRate / (1 - iptRate) / (1 - (sellerCommissionRate / (1 - iptRate)));
//       const commissionAdjustment = getCommissionAdjustment();
//       sellerCommission = Number((baseSellerCommission + commissionAdjustment).toFixed(2));
//   }

//   const ipt = Number((((underwritingPremium + sellerCommission + mgaPayment) * iptRate) / (1 - iptRate)).toFixed(2));

//   const insurancePremium = underwritingPremium + mgaPayment + sellerCommission + ipt;

//   if (!isCommissionedSale) {
//       const referralRate = referralPaymentRates[input.product];
//       const baseReferralInclGST = Math.max(getMinReferral(input.product, term), (insurancePremium / (1 - referralRate)) - insurancePremium);
//       const dealershipReferralFee = getMinDealershipReferral(term);
//       const dealershipReferralFeeGST = dealershipReferralFee - (dealershipReferralFee / (1 + gstRate));
//       const dealerGroupReferralFee = baseReferralInclGST - dealershipReferralFee;
//       const dealerGroupReferralFeeGST = dealerGroupReferralFee - (dealerGroupReferralFee / (1 + gstRate));
//       const referralAdjustment = getReferralAdjustment();
//       referralPayment = Number((baseReferralInclGST + referralAdjustment).toFixed(2));
//   }

//   const adminFee = getAdminFee();

//   const transferCredit = input.transferCredit || 0;

//   const retailBeforeTax = insurancePremium + referralPayment + adminFee - transferCredit;
//   const retailTax = retailBeforeTax * rstRate;
//   const retailPriceAfterTax = Number((retailBeforeTax + retailTax).toFixed(2));

//   return {
//       retailPriceAfterTax,
//       details: {
//           underwritingPremium,
//           mgaPayment,
//           sellerCommission,
//           ipt,
//           insurancePremium,
//           referralPayment,
//           adminFee,
//           transferCredit,
//           retailTax
//       }
//   };
// }