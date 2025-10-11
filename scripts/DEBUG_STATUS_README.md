# 🐛 Debug Course Status Issues

## 🎯 Vấn đề

Sau khi submit course từ draft → submitted, nhưng UI vẫn hiển thị sai hoặc không cập nhật.

---

## 🔍 Debug Steps

### **1. Check Database Status**

Chạy script để kiểm tra status hiện tại trong database:

```bash
# Windows Command Prompt
scripts\check-status.cmd

# PowerShell
scripts\check-status.ps1

# Node.js directly
node scripts/check-course-status.js
```

**Expected Output:**
```
📊 Found X courses:
1. Course Name
   ID: 68e6101cce7d9e2ccd1e79a0
   Status: draft
   isPublished: false
   isApproved: false
   submittedForReview: false
   submittedAt: null
   hasUnsavedChanges: false
```

### **2. Check Console Logs**

#### **Frontend Console (F12):**
```
✅ Submit success, response: {success: true, data: {...}}
🔄 Loading courses with params: {...}
📊 Courses response: {...}
```

#### **Backend Console:**
```
🔍 UpdateCourseStatus: {courseId: "...", currentStatus: "draft", requestedStatus: "submitted"}
✅ Course status updated: {courseId: "...", newStatus: "submitted", submittedAt: "..."}
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: Status field is UNDEFINED**

**Symptoms:**
```
Status: UNDEFINED
```

**Cause:** Course documents created before status field was added.

**Solution:**
```bash
# Run migration script
scripts\migrate-status.cmd
```

### **Issue 2: Frontend not refreshing**

**Symptoms:**
- Submit success but UI doesn't change
- Console shows success but buttons still enabled

**Solution:**
1. Check if `loadCourses()` is called after submit
2. Check if API response contains updated data
3. Try hard refresh (Ctrl+F5)

### **Issue 3: Backend not updating**

**Symptoms:**
- Backend logs show error
- Database status unchanged

**Solution:**
1. Check if course exists and belongs to teacher
2. Check if status field exists in database
3. Check MongoDB connection

### **Issue 4: API Response wrong format**

**Symptoms:**
- Frontend gets error
- Response format unexpected

**Solution:**
1. Check backend controller response format
2. Check service return value
3. Check API endpoint configuration

---

## 🔧 Manual Database Check

### **Connect to MongoDB:**
```bash
mongosh
use lms
```

### **Check specific course:**
```javascript
db.courses.findOne({_id: ObjectId("68e6101cce7d9e2ccd1e79a0")})
```

### **Check all courses:**
```javascript
db.courses.find({}, {title: 1, status: 1, isPublished: 1, submittedForReview: 1})
```

### **Update course manually (if needed):**
```javascript
db.courses.updateOne(
  {_id: ObjectId("68e6101cce7d9e2ccd1e79a0")},
  {
    $set: {
      status: "submitted",
      submittedForReview: true,
      submittedAt: new Date()
    }
  }
)
```

---

## 📊 Expected Status Flow

### **Draft Course:**
```
Initial: status: "draft", submittedForReview: false, submittedAt: null
After Submit: status: "submitted", submittedForReview: true, submittedAt: Date
```

### **Published Course:**
```
Initial: status: "published", hasUnsavedChanges: false
After Edit: status: "published", hasUnsavedChanges: true
After Resubmit: status: "submitted", hasUnsavedChanges: false
```

---

## 🎯 Testing Checklist

### **Test 1: Draft Submit**
- [ ] Create draft course
- [ ] Click "Gửi duyệt"
- [ ] Check console logs
- [ ] Verify status changed to "submitted"
- [ ] Verify UI buttons disabled
- [ ] Verify status chip shows "Chờ duyệt"

### **Test 2: Published Edit**
- [ ] Find published course
- [ ] Click "Sửa"
- [ ] Make changes and save
- [ ] Verify hasUnsavedChanges = true
- [ ] Verify "Gửi lại duyệt" button appears
- [ ] Submit and verify status = "submitted"

### **Test 3: Database Consistency**
- [ ] Run check-status script
- [ ] Verify no UNDEFINED statuses
- [ ] Verify all fields populated correctly
- [ ] Check for orphaned data

---

## 🚀 Quick Fixes

### **Reset Course to Draft:**
```javascript
db.courses.updateOne(
  {_id: ObjectId("COURSE_ID")},
  {
    $set: {
      status: "draft",
      submittedForReview: false,
      submittedAt: null,
      hasUnsavedChanges: false
    }
  }
)
```

### **Force Refresh Frontend:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check Network tab for API calls
4. Verify API responses

### **Restart Backend:**
```bash
# Kill existing process
Ctrl+C

# Restart
npm run dev
```

---

## 📝 Debug Log Template

```
Date: ___________
Issue: ___________
Steps to reproduce:
1. ___________
2. ___________
3. ___________

Expected: ___________
Actual: ___________

Console Logs:
Frontend: ___________
Backend: ___________

Database Status:
Before: ___________
After: ___________

Solution: ___________
```

---

## 🔗 Related Files

- Backend Service: `lms-backend/src/client/services/course.service.ts`
- Frontend UI: `lms-frontend/src/pages/client/Teacher/CourseStudio/CourseStudio.tsx`
- Course Model: `lms-backend/src/shared/models/core/Course.ts`
- Migration Script: `lms-backend/scripts/migrate-course-status.js`
- Check Script: `lms-backend/scripts/check-course-status.js`
