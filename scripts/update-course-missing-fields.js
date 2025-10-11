const mongoose = require('mongoose');
require('dotenv').config();

async function updateMissingFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Get database
    const db = mongoose.connection.db;
    
    // Find course with missing fields
    const courseId = '68e42abf958c8e62df06e894';
    const course = await db.collection('courses').findOne({ 
      _id: new mongoose.Types.ObjectId(courseId) 
    });
    
    if (course) {
      console.log(`\n🔧 Updating course: ${course.title}`);
      console.log(`   Current estimatedDuration: ${course.estimatedDuration}`);
      console.log(`   Current totalDuration: ${course.totalDuration}`);
      console.log(`   Current prerequisites: ${course.prerequisites?.length || 0} items`);
      console.log(`   Current learningObjectives: ${course.learningObjectives?.length || 0} items`);
      console.log(`   Current certificate: ${course.certificate}`);
      console.log(`   Current assessment.hasCertification: ${course.assessment?.hasCertification}`);
      
      // Update missing fields with sample data
      const updates = {
        estimatedDuration: 10, // 10 hours
        totalDuration: 600, // 600 minutes = 10 hours
        prerequisites: [
          "Kiến thức cơ bản về máy tính",
          "Hiểu biết về Internet và trình duyệt web"
        ],
        learningObjectives: [
          "Hiểu được các khái niệm cơ bản về web development",
          "Biết cách sử dụng HTML và CSS",
          "Có thể tạo website đơn giản",
          "Hiểu về responsive design"
        ],
        certificate: true,
        benefits: [
          "Học được kiến thức thực tế về web development",
          "Có thể tự tạo website",
          "Hiểu về quy trình phát triển web",
          "Có chứng chỉ hoàn thành khóa học"
        ]
      };
      
      // Update assessment.hasCertification to match certificate
      if (course.assessment) {
        updates['assessment.hasCertification'] = true;
      } else {
        updates.assessment = {
          hasQuizzes: false,
          hasAssignments: false,
          hasFinalExam: false,
          hasCertification: true,
          passingScore: 70,
          maxAttempts: 3
        };
      }
      
      const result = await db.collection('courses').updateOne(
        { _id: new mongoose.Types.ObjectId(courseId) },
        { $set: updates }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated course with missing fields`);
        
        // Verify the update
        const updatedCourse = await db.collection('courses').findOne({ 
          _id: new mongoose.Types.ObjectId(courseId) 
        });
        
        console.log(`\n📊 Updated fields:`);
        console.log(`   estimatedDuration: ${updatedCourse.estimatedDuration}`);
        console.log(`   totalDuration: ${updatedCourse.totalDuration}`);
        console.log(`   prerequisites: ${updatedCourse.prerequisites?.length || 0} items`);
        console.log(`   learningObjectives: ${updatedCourse.learningObjectives?.length || 0} items`);
        console.log(`   certificate: ${updatedCourse.certificate}`);
        console.log(`   assessment.hasCertification: ${updatedCourse.assessment?.hasCertification}`);
        console.log(`   benefits: ${updatedCourse.benefits?.length || 0} items`);
      } else {
        console.log(`⚠️  No changes made`);
      }
    } else {
      console.log(`❌ Course with ID ${courseId} not found`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateMissingFields();
