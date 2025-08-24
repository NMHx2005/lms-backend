// Test script để kiểm tra logic discount calculation
console.log('🔍 Testing Discount Calculation Logic...\n');

const testCases = [
  {
    name: 'Course 1: Web Development',
    originalPrice: 3000000,
    price: 2500000,
    discountPercentage: 16.67
  },
  {
    name: 'Course 2: React Native',
    originalPrice: 3500000,
    price: 3000000,
    discountPercentage: 14.29
  },
  {
    name: 'Course 3: Machine Learning',
    originalPrice: 4500000,
    price: 4000000,
    discountPercentage: 11.11
  },
  {
    name: 'Course 4: UI/UX Design',
    originalPrice: 2500000,
    price: 2000000,
    discountPercentage: 20
  },
  {
    name: 'Course 5: DevOps',
    originalPrice: 4000000,
    price: 3500000,
    discountPercentage: 12.5
  }
];

testCases.forEach(testCase => {
  const calculatedPrice = testCase.originalPrice * (1 - testCase.discountPercentage / 100);
  const difference = Math.abs(calculatedPrice - testCase.price);
  const isValid = difference < 1000; // Allow 1000 VND difference
  
  console.log(`📚 ${testCase.name}:`);
  console.log(`   Original Price: ${testCase.originalPrice.toLocaleString()} VND`);
  console.log(`   Target Price: ${testCase.price.toLocaleString()} VND`);
  console.log(`   Discount: ${testCase.discountPercentage}%`);
  console.log(`   Calculated Price: ${calculatedPrice.toLocaleString()} VND`);
  console.log(`   Difference: ${difference.toLocaleString()} VND`);
  console.log(`   Status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log('');
});

console.log('🎯 All discount calculations should be within 1000 VND tolerance!');
