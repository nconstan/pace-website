import { getMaximumReadAccess } from './maximumAccess.js';

// Mock user objects for testing
const mockUser1 = {
    id: '1',
    roles: [1],
    dealerships: ['101', '102'],
    dealerGroupId: '201'
};

const mockUser2 = {
    id: '2',
    roles: [2],
    dealerships: ['101', '102'],
    dealerGroupId: '201'
};

const mockUser3 = {
    id: '3',
    roles: [3],
    dealerships: ['101', '102'],
    dealerGroupId: '201'
};

const mockUser12 = {
    id: '4',
    roles: [12],
    dealerships: ['101', '102'],
    dealerGroupId: '201'
};

// Test cases
console.log('=== Testing Maximum Access Control ===\n');

// Test 1: Role 1 requesting all policies
console.log('Test 1: Role 1 requesting all policies');
const result1 = getMaximumReadAccess(
    mockUser1.roles,
    { policies: 'all' },
    {},
    mockUser1
);
console.log('Success:', result1.success);
if (result1.success) {
    console.log('Where clause:', JSON.stringify(result1.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result1.clauses?.include, null, 2));
} else {
    console.log('Error:', result1.error);
}
console.log('\n');

// Test 2: Role 1 requesting specific fields
console.log('Test 2: Role 1 requesting specific fields');
const result2 = getMaximumReadAccess(
    mockUser1.roles,
    { 
        policies: ['created_at', 'policy_status', 'total_price'],
        vehicle_details: ['vin', 'make', 'model']
    },
    {},
    mockUser1
);
console.log('Success:', result2.success);
if (result2.success) {
    console.log('Where clause:', JSON.stringify(result2.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result2.clauses?.include, null, 2));
} else {
    console.log('Error:', result2.error);
}
console.log('\n');

// Test 3: Role 1 requesting authorized field
console.log('Test 3: Role 1 requesting authorized field (referral_clawback)');
const result3 = getMaximumReadAccess(
    mockUser1.roles,
    { 
        cancelation_details: ['referral_clawback'] // Role 1 should have access to this
    },
    {},
    mockUser1
);
console.log('Success:', result3.success);
if (result3.success) {
    console.log('Where clause:', JSON.stringify(result3.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result3.clauses?.include, null, 2));
} else {
    console.log('Error:', result3.error);
}
console.log('\n');

// Test 4: Role 2 requesting dealership_clawback (should work)
console.log('Test 4: Role 2 requesting dealership_clawback');
const result4 = getMaximumReadAccess(
    mockUser2.roles,
    { 
        cancelation_details: ['dealership_clawback']
    },
    {},
    mockUser2
);
console.log('Success:', result4.success);
if (result4.success) {
    console.log('Where clause:', JSON.stringify(result4.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result4.clauses?.include, null, 2));
} else {
    console.log('Error:', result4.error);
}
console.log('\n');

// Test 5: Role 2 requesting referral_clawback (should fail)
console.log('Test 5: Role 2 requesting referral_clawback (should fail)');
const result5 = getMaximumReadAccess(
    mockUser2.roles,
    { 
        cancelation_details: ['referral_clawback']
    },
    {},
    mockUser2
);
console.log('Success:', result5.success);
if (result5.success) {
    console.log('Where clause:', JSON.stringify(result5.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result5.clauses?.include, null, 2));
} else {
    console.log('Error:', result5.error);
}
console.log('\n');

// Test 6: Role 3 requesting dealer_group_clawback (should work)
console.log('Test 6: Role 3 requesting dealer_group_clawback');
const result6 = getMaximumReadAccess(
    mockUser3.roles,
    { 
        cancelation_details: ['dealer_group_clawback']
    },
    {},
    mockUser3
);
console.log('Success:', result6.success);
if (result6.success) {
    console.log('Where clause:', JSON.stringify(result6.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result6.clauses?.include, null, 2));
} else {
    console.log('Error:', result6.error);
}
console.log('\n');

// Test 7: Role 12 requesting everything (should work)
console.log('Test 7: Role 12 requesting everything');
const result7 = getMaximumReadAccess(
    mockUser12.roles,
    { 
        policies: 'all',
        vehicle_details: 'all',
        cancelation_details: 'all',
        pricing_details: 'all'
    },
    {},
    mockUser12
);
console.log('Success:', result7.success);
if (result7.success) {
    console.log('Where clause:', JSON.stringify(result7.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result7.clauses?.include, null, 2));
} else {
    console.log('Error:', result7.error);
}
console.log('\n');

// Test 8: Additional filters
console.log('Test 8: Role 1 with additional filters');
const result8 = getMaximumReadAccess(
    mockUser1.roles,
    { policies: 'all' },
    {
        policies: {
            policy_status: { in: [1, 2, 3] },
            created_at: {
                gte: new Date('2023-01-01'),
                lte: new Date('2023-12-31')
            }
        }
    },
    mockUser1
);
console.log('Success:', result8.success);
if (result8.success) {
    console.log('Where clause:', JSON.stringify(result8.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result8.clauses?.include, null, 2));
} else {
    console.log('Error:', result8.error);
}
console.log('\n');

// Test 9: Invalid filter field
console.log('Test 9: Role 1 trying to filter on unauthorized field');
const result9 = getMaximumReadAccess(
    mockUser1.roles,
    { policies: 'all' },
    {
        policies: {
            dealer_group_id: 123 // Role 1 shouldn't be able to filter on this
        }
    },
    mockUser1
);
console.log('Success:', result9.success);
if (result9.success) {
    console.log('Where clause:', JSON.stringify(result9.clauses?.where, null, 2));
    console.log('Include clause:', JSON.stringify(result9.clauses?.include, null, 2));
} else {
    console.log('Error:', result9.error);
}
console.log('\n');

console.log('=== Test Complete ===');
