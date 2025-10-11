/**
 * Script to drop text indexes that cause language override issues
 * Run: node scripts/drop-text-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropTextIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Get all indexes
    const indexes = await coursesCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Find and drop text indexes
    const textIndexes = indexes.filter(index => {
      return Object.values(index.key).includes('text');
    });

    if (textIndexes.length === 0) {
      console.log('\n✅ No text indexes found');
    } else {
      console.log(`\n🗑️  Dropping ${textIndexes.length} text index(es)...`);
      
      for (const index of textIndexes) {
        try {
          await coursesCollection.dropIndex(index.name);
          console.log(`  ✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`  ❌ Failed to drop index ${index.name}:`, error.message);
        }
      }
    }

    // Verify
    const remainingIndexes = await coursesCollection.indexes();
    console.log('\n📋 Remaining indexes:');
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropTextIndexes();

