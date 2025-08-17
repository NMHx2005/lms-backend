import { testCorsConfiguration, getCorsSummary } from '../shared/utils/corsTest';

// Test CORS configuration
console.log('🚀 Testing CORS Configuration...\n');

// Run the test
testCorsConfiguration();

console.log('\n📊 CORS Summary:');
console.log(JSON.stringify(getCorsSummary(), null, 2));

console.log('\n✅ CORS test completed!');
