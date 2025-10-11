# 🔧 Course Fields Fix - Missing Data Issue

## 📋 **VẤN ĐỀ:**

Khi teacher tạo hoặc chỉnh sửa khóa học, một số fields không được lưu vào database hoặc không hiển thị trong API response:

### **❌ FIELDS BỊ THIẾU/SAI:**
1. `originalPrice` - Giá gốc
2. `discountPercentage` - Phần trăm giảm giá
3. `maxStudents` - Số học viên tối đa
4. `certificate` / `certificateAvailable` - Chứng chỉ
5. `benefits` - Lợi ích khóa học
6. `isFree` - Khóa học miễn phí

---

## 🔍 **NGUYÊN NHÂN:**

### **1. Backend Mapping Issue:**
Trong `updateCourse` method, các fields sau khi được map lại bị **delete** nhầm:

```typescript
// ❌ SAI - Bị delete sau khi map
if (updates.benefits !== undefined) {
  mappedUpdates.benefits = updates.benefits;
  delete mappedUpdates.benefits; // ❌ Xóa luôn field vừa map
}
```

### **2. Missing Field Mapping:**
Field `certificateAvailable` không được map sang `certificate` và `assessment.hasCertification`.

### **3. Update Method Issue:**
`findOneAndUpdate` không dùng `$set`, có thể gây vấn đề với nested fields.

---

## ✅ **GIẢI PHÁP:**

### **1. Sửa Backend Mapping (`course.service.ts`):**

#### **A. Update Course - Không delete fields đã map đúng:**
```typescript
// ✅ ĐÚNG - Giữ lại fields
if (updates.benefits !== undefined) {
  mappedUpdates.benefits = updates.benefits;
  // Don't delete - benefits is already the correct field name
}
if (updates.originalPrice !== undefined) {
  mappedUpdates.originalPrice = updates.originalPrice;
  // Don't delete - originalPrice is already the correct field name
}
if (updates.discountPercentage !== undefined) {
  mappedUpdates.discountPercentage = updates.discountPercentage;
  // Don't delete - discountPercentage is already the correct field name
}
if (updates.maxStudents !== undefined) {
  mappedUpdates.maxStudents = updates.maxStudents;
  // Don't delete - maxStudents is already the correct field name
}
```

#### **B. Map certificateAvailable → certificate:**
```typescript
if (updates.certificateAvailable !== undefined) {
  mappedUpdates.certificate = updates.certificateAvailable;
  mappedUpdates['assessment.hasCertification'] = updates.certificateAvailable;
  delete mappedUpdates.certificateAvailable; // Delete frontend field name
}
```

#### **C. Sử dụng $set trong findOneAndUpdate:**
```typescript
// ✅ ĐÚNG - Dùng $set
const course = await CourseModel.findOneAndUpdate(
  { _id: courseId, instructorId: teacherId },
  { $set: mappedUpdates }, // ✅ $set để update nested fields đúng
  { new: true, runValidators: true }
);
```

### **2. Create Course - Thêm certificate field:**
```typescript
const mappedData = {
  // ... other fields
  assessment: {
    hasQuizzes: false,
    hasAssignments: false,
    hasFinalExam: false,
    hasCertification: courseData.certificateAvailable || false,
    passingScore: 70,
    maxAttempts: 3
  },
  // ✅ NEW: Top-level certificate field (for backward compatibility)
  certificate: courseData.certificateAvailable || false
};
```

### **3. Debug Logging:**
```typescript
console.log('🔍 Update Course - Mapped Updates:', {
  originalPrice: mappedUpdates.originalPrice,
  discountPercentage: mappedUpdates.discountPercentage,
  maxStudents: mappedUpdates.maxStudents,
  certificate: mappedUpdates.certificate,
  benefits: mappedUpdates.benefits,
  isFree: mappedUpdates.isFree
});
```

---

## 📊 **FIELD MAPPING REFERENCE:**

| Frontend Field | Backend Field | Notes |
|---|---|---|
| `originalPrice` | `originalPrice` | ✅ Direct mapping |
| `discountPercentage` | `discountPercentage` | ✅ Direct mapping |
| `maxStudents` | `maxStudents` | ✅ Direct mapping |
| `benefits` | `benefits` | ✅ Direct mapping |
| `isFree` | `isFree` | ✅ Direct mapping |
| `certificateAvailable` | `certificate` + `assessment.hasCertification` | ⚠️ Need to map to 2 fields |
| `duration` | `estimatedDuration` | ⚠️ Need to rename |
| `requirements` | `prerequisites` | ⚠️ Need to rename |
| `objectives` | `learningObjectives` | ⚠️ Need to rename |

---

## 🧪 **TESTING:**

### **Test Script:**
```bash
node scripts/test-update-course-fields.js
```

### **Expected Output:**
```
✅ Final Verification:
   All fields present: true
   Has originalPrice: true
   Has discountPercentage: true
   Has maxStudents: true
   Has certificate: true
   Has benefits: true
```

### **Manual Testing:**
1. **Create Course:**
   - Fill all fields including originalPrice, discountPercentage, maxStudents, benefits, certificate
   - Save
   - Check database: all fields should be present

2. **Update Course:**
   - Edit existing course
   - Update originalPrice, discountPercentage, maxStudents, benefits, certificate
   - Save
   - Check database: all fields should be updated
   - Check API response: all fields should be returned

3. **Frontend Display:**
   - Open Course Editor
   - Check console logs for loaded data
   - All fields should display correctly

---

## 📝 **FILES MODIFIED:**

### **Backend:**
- `lms-backend/src/client/services/course.service.ts`
  - Fixed `updateCourse` method field mapping
  - Added `certificate` field to `createCourse`
  - Added `$set` to `findOneAndUpdate`
  - Added debug logging

### **Frontend:**
- `lms-frontend/src/pages/client/Teacher/CourseEditor/CourseEditor.tsx`
  - Already has correct field mapping
  - Has debug logging for data flow

### **Test Scripts:**
- `lms-backend/scripts/test-update-course-fields.js`
- `lms-backend/scripts/test-full-course-flow.js`
- `lms-backend/scripts/test-benefits-field.js`

---

## ✅ **RESULT:**

✅ **originalPrice** - Được lưu và hiển thị đúng  
✅ **discountPercentage** - Được lưu và hiển thị đúng  
✅ **maxStudents** - Được lưu và hiển thị đúng  
✅ **certificate** - Được lưu và hiển thị đúng  
✅ **benefits** - Được lưu và hiển thị đúng  
✅ **isFree** - Được lưu và hiển thị đúng  

**All course fields are now working correctly!** 🎉
