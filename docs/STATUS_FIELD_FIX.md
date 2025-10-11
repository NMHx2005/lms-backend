# 🔧 Fix Status Field Integration

## 🎯 **VẤN ĐỀ ĐÃ GIẢI QUYẾT**

### **❌ Trước khi fix:**
- Course submit thành công nhưng frontend vẫn hiển thị `status: "draft"`
- Admin API hiển thị course như draft thay vì submitted
- Teacher API không trả về `status` field từ database

### **✅ Sau khi fix:**
- Course submit → `status: "submitted"` → Frontend hiển thị đúng
- Admin API hiển thị course submitted trong pending list
- Teacher API trả về đúng `status` và `hasUnsavedChanges`

---

## 🔧 **CÁC THAY ĐỔI ĐÃ THỰC HIỆN**

### **1️⃣ Backend Service - `getTeacherCourses`**

#### **❌ Trước:**
```typescript
.select('title thumbnail domain level price isPublished isApproved totalStudents averageRating createdAt updatedAt')

// Filter logic cũ
if (status === 'draft') {
  query.isPublished = false;
} else if (status === 'published') {
  query.isPublished = true;
  query.isApproved = true;
}

// Return logic cũ
status: course.isPublished ? (course.isApproved ? 'published' : 'pending') : 'draft',
```

#### **✅ Sau:**
```typescript
.select('title thumbnail domain level price status hasUnsavedChanges isPublished isApproved totalStudents averageRating createdAt updatedAt')

// Filter logic mới
if (status === 'draft') {
  query.status = 'draft';
} else if (status === 'published') {
  query.status = 'published';
} else if (status === 'pending') {
  query.status = 'submitted';
}

// Return logic mới
status: course.status || 'draft',
hasUnsavedChanges: course.hasUnsavedChanges || false,
```

### **2️⃣ Backend Service - `getTeacherCourseStats`**

#### **❌ Trước:**
```typescript
CourseModel.countDocuments({ instructorId: teacherId, isPublished: true, isApproved: true }),
CourseModel.countDocuments({ instructorId: teacherId, isPublished: false }),
CourseModel.countDocuments({ instructorId: teacherId, isPublished: true, isApproved: false }),
```

#### **✅ Sau:**
```typescript
CourseModel.countDocuments({ instructorId: teacherId, status: 'published' }),
CourseModel.countDocuments({ instructorId: teacherId, status: 'draft' }),
CourseModel.countDocuments({ instructorId: teacherId, status: 'submitted' }),
```

### **3️⃣ Enhanced Debug Logging**

```typescript
console.log('🔍 Submit Debug:', {
  courseId,
  currentStatus,
  requestedStatus: status,
  courseStatus: course.status,
  submittedForReview: course.submittedForReview,
  submittedAt: course.submittedAt
});
```

---

## 📊 **KẾT QUẢ TESTING**

### **Database Status (After Fix):**
```
📊 Found 7 total courses:
1. Lập trình Web Frontend từ Cơ bản đến Nâng cao
   Status: published ✅

2. Phát triển Ứng dụng Mobile với React Native  
   Status: published ✅

3. Machine Learning và AI cơ bản
   Status: published ✅

4. Thiết kế UI/UX cho Web và Mobile
   Status: published ✅

5. DevOps và CI/CD Pipeline
   Status: published ✅

6. test update
   Status: published ✅

7. Java Web dễ hiểu - Tự làm Website với AI (2025)
   Status: submitted ✅

📈 Status Summary:
   published: 6 courses
   submitted: 1 courses
```

### **API Response (Expected):**

#### **Teacher API:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68e71ea805720c61b1ec1457",
      "title": "Java Web dễ hiểu - Tự làm Website với AI (2025)",
      "status": "submitted",  // ✅ Đúng rồi!
      "hasUnsavedChanges": false
    }
  ]
}
```

#### **Admin API:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 7,
    "publishedCourses": 6,    // ✅ Đúng!
    "pendingApproval": 1,     // ✅ Đúng!
    "draftCourses": 0         // ✅ Đúng!
  }
}
```

---

## 🎯 **WORKFLOW ĐÚNG**

### **Draft Course Submit:**
```
1. Course: status = "draft" (hoặc undefined)
2. Teacher clicks "Gửi duyệt"
3. Backend: status = "submitted", submittedAt = Date, submittedForReview = true
4. Frontend: Hiển thị "Chờ duyệt" thay vì "Gửi duyệt"
5. Admin: Thấy course trong pending list
```

### **Published Course Resubmit:**
```
1. Course: status = "published", hasUnsavedChanges = true
2. Teacher clicks "Gửi lại duyệt"  
3. Backend: status = "submitted", isPublished = false, hasUnsavedChanges = false
4. Frontend: Hiển thị "Chờ duyệt"
5. Admin: Thấy course trong pending list để review lại
```

---

## 🔍 **DEBUG TOOLS**

### **1️⃣ Check Database Status:**
```bash
node scripts/check-course-simple.js
```

### **2️⃣ Check API Response:**
```bash
# Teacher API
curl -X GET "http://localhost:5000/api/client/courses/my-courses" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin API  
curl -X GET "http://localhost:5000/api/admin/courses/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### **3️⃣ Backend Console Logs:**
```
🔍 Submit Debug: {
  courseId: "68e71ea805720c61b1ec1457",
  currentStatus: "draft",
  requestedStatus: "submitted",
  courseStatus: "draft",
  submittedForReview: false,
  submittedAt: null
}
📝 Draft course submission
✅ Course status updated: {
  courseId: "68e71ea805720c61b1ec1457",
  newStatus: "submitted",
  submittedAt: "2025-10-09T09:26:49.123Z",
  submittedForReview: true,
  hasUnsavedChanges: false
}
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Frontend UI:**
- [ ] Draft course shows "Gửi duyệt" button
- [ ] After submit, shows "Đang chờ admin duyệt" 
- [ ] Published course with changes shows "Gửi lại duyệt"
- [ ] Submitted course disables edit/structure buttons

### **Backend API:**
- [ ] Teacher API returns correct `status` field
- [ ] Teacher API returns `hasUnsavedChanges` field
- [ ] Admin stats show correct counts
- [ ] Admin pending list shows submitted courses

### **Database:**
- [ ] All courses have `status` field
- [ ] Submit updates `status` to "submitted"
- [ ] Submit sets `submittedAt` and `submittedForReview`
- [ ] No courses with inconsistent status

---

## 🚀 **TESTING STEPS**

### **1️⃣ Test Draft Submit:**
```
1. Create new course (status = "draft")
2. Click "Gửi duyệt"
3. Check frontend: Button changes to "Đang chờ admin duyệt"
4. Check admin: Course appears in pending list
5. Check database: status = "submitted"
```

### **2️⃣ Test Published Resubmit:**
```
1. Edit published course (hasUnsavedChanges = true)
2. Click "Gửi lại duyệt"
3. Check frontend: Button changes to "Đang chờ admin duyệt"
4. Check admin: Course appears in pending list
5. Check database: status = "submitted", isPublished = false
```

### **3️⃣ Test Admin Stats:**
```
1. Check /api/admin/courses/stats
2. Verify: publishedCourses = 6, pendingApproval = 1, draftCourses = 0
3. Verify: totalCourses = 7
```

---

## 🔗 **Related Files**

- **Backend Service**: `lms-backend/src/client/services/course.service.ts`
- **Frontend UI**: `lms-frontend/src/pages/client/Teacher/CourseStudio/CourseStudio.tsx`
- **Admin Service**: `lms-backend/src/admin/services/course.service.ts`
- **Course Model**: `lms-backend/src/shared/models/core/Course.ts`
- **Debug Scripts**: `lms-backend/scripts/check-course-simple.js`
