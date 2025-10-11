const mongoose = require('mongoose');
require('dotenv').config();

async function fixPublishedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Get database
    const db = mongoose.connection.db;
    
    console.log('\n🔧 Fixing published courses...');
    
    // 1. Fix courses with isPublished=true but missing publishedAt
    const publishedWithoutDate = await db.collection('courses').find({
      isPublished: true,
      publishedAt: null
    }).toArray();
    
    console.log(`\n📊 Found ${publishedWithoutDate.length} published courses without publishedAt:`);
    publishedWithoutDate.forEach(course => {
      console.log(`   - ${course.title} (ID: ${course._id})`);
    });
    
    if (publishedWithoutDate.length > 0) {
      const result1 = await db.collection('courses').updateMany(
        { isPublished: true, publishedAt: null },
        { 
          $set: { 
            publishedAt: new Date(),
            status: 'published'  // Also fix status field
          } 
        }
      );
      console.log(`✅ Updated ${result1.modifiedCount} courses with publishedAt`);
    }
    
    // 2. Fix inconsistent course "test update" (draft status but isPublished=true)
    const inconsistentCourse = await db.collection('courses').findOne({
      _id: new mongoose.Types.ObjectId('68e42abf958c8e62df06e894')
    });
    
    if (inconsistentCourse) {
      console.log(`\n🔧 Fixing inconsistent course: ${inconsistentCourse.title}`);
      console.log(`   Current: status=${inconsistentCourse.status}, isPublished=${inconsistentCourse.isPublished}, isApproved=${inconsistentCourse.isApproved}`);
      
      // Since it's published and approved, set proper status
      const result2 = await db.collection('courses').updateOne(
        { _id: new mongoose.Types.ObjectId('68e42abf958c8e62df06e894') },
        { 
          $set: { 
            status: 'published',
            publishedAt: new Date('2025-10-06T22:53:12.531Z'), // Use updatedAt as publishedAt
            hasUnsavedChanges: false
          } 
        }
      );
      console.log(`✅ Fixed inconsistent course status`);
    }
    
    // 3. Verify all courses now have proper status
    console.log('\n📊 Verifying all courses after fix...');
    const allCourses = await db.collection('courses').find({}).toArray();
    
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   Status: ${course.status || 'UNDEFINED'}`);
      console.log(`   isPublished: ${course.isPublished}`);
      console.log(`   isApproved: ${course.isApproved}`);
      console.log(`   publishedAt: ${course.publishedAt || 'null'}`);
      console.log(`   hasUnsavedChanges: ${course.hasUnsavedChanges}`);
      console.log('   ' + '-'.repeat(50));
    });
    
    // 4. Count by status
    const statusCounts = {};
    allCourses.forEach(course => {
      const status = course.status || 'UNDEFINED';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Final Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} courses`);
    });
    
    // 5. Count published courses
    const publishedCount = await db.collection('courses').countDocuments({
      isPublished: true
    });
    
    const publishedWithDateCount = await db.collection('courses').countDocuments({
      isPublished: true,
      publishedAt: { $ne: null }
    });
    
    console.log(`\n📊 Published Courses Summary:`);
    console.log(`   Total with isPublished=true: ${publishedCount}`);
    console.log(`   Total with publishedAt set: ${publishedWithDateCount}`);
    
    if (publishedCount === publishedWithDateCount) {
      console.log('✅ All published courses now have publishedAt!');
    } else {
      console.log('⚠️  Some published courses still missing publishedAt');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixPublishedCourses();
