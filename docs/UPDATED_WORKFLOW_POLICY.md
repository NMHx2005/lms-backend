# 📋 Chính sách Workflow Khóa học (Cập nhật)

## 🎯 Mục đích

Quản lý workflow khóa học với logic linh hoạt hơn:
- **Draft courses**: Chỉ gửi duyệt 1 lần duy nhất
- **Published courses**: Có thể sửa và gửi lại duyệt nhiều lần

---

## 📜 Quy định mới

### ✅ **DRAFT COURSES** (Khóa học nháp):
- ✅ Teacher có thể sửa/xóa không giới hạn
- ✅ Teacher có thể gửi duyệt **1 LẦN DUY NHẤT**
- ❌ Sau khi gửi, KHÔNG THỂ rút lại hoặc gửi lại

### ✅ **PUBLISHED COURSES** (Khóa học đã xuất bản):
- ✅ Teacher có thể **SỬA** (nhưng phải gửi duyệt lại)
- ✅ Teacher có thể **CẤU TRÚC** (sửa thoải mái)
- ✅ Teacher có thể **GỬI LẠI DUYỆT** (nhiều lần)
- ❌ Teacher KHÔNG THỂ **XÓA**

### ❌ **SUBMITTED/APPROVED COURSES**:
- ❌ Teacher KHÔNG THỂ sửa/cấu trúc/gửi duyệt
- ❌ Chỉ admin mới có thể xử lý

---

## 🔄 Workflow Chi tiết

```
┌────────────────────────────────────────────────────────────┐
│ DRAFT                                                       │
│ • Teacher: Sửa/Cấu trúc/Xóa/Gửi duyệt (1 lần)             │
│ • Nút: [Sửa] [Cấu trúc] [Gửi duyệt] [🗑️]                  │
└────────────────────────────────────────────────────────────┘
                          ↓ Gửi duyệt (1 lần duy nhất)
┌────────────────────────────────────────────────────────────┐
│ SUBMITTED (Chờ duyệt)                                      │
│ • Teacher: KHÔNG THỂ làm gì                                │
│ • Nút: [Sửa (disabled)] [Cấu trúc (disabled)] [Đang chờ admin duyệt (disabled)] │
└────────────────────────────────────────────────────────────┘
                          ↓ Admin duyệt
┌────────────────────────────────────────────────────────────┐
│ APPROVED (Đã duyệt)                                        │
│ • Teacher: KHÔNG THỂ làm gì                                │
│ • Nút: [Sửa (disabled)] [Cấu trúc (disabled)] [Đã được duyệt - chờ xuất bản (disabled)] │
└────────────────────────────────────────────────────────────┘
                          ↓ Admin publish
┌────────────────────────────────────────────────────────────┐
│ PUBLISHED (Đã xuất bản)                                    │
│ • Teacher: Sửa/Cấu trúc/Gửi lại duyệt (nhiều lần)         │
│ • Nút: [Sửa] [Cấu trúc] [Gửi lại duyệt]                   │
└────────────────────────────────────────────────────────────┘
                          ↓ Teacher sửa + gửi lại
┌────────────────────────────────────────────────────────────┐
│ SUBMITTED (Chờ duyệt lại)                                  │
│ • Teacher: KHÔNG THỂ làm gì                                │
│ • Nút: [Sửa (disabled)] [Cấu trúc (disabled)] [Đang chờ admin duyệt (disabled)] │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend UI

### **Draft Course:**
```
┌─────────────────────────────────────────────────────────┐
│ [Bản nháp] (grey chip)                                  │
│ Tên khóa học                                           │
│ ├─ [Sửa] [Cấu trúc] [Gửi duyệt] [🗑️] (all enabled)     │
└─────────────────────────────────────────────────────────┘
```

### **Published Course:**
```
┌─────────────────────────────────────────────────────────┐
│ [Đã xuất bản] (green chip)                              │
│ Tên khóa học                                           │
│ ├─ [Sửa] [Cấu trúc] [Gửi lại duyệt] (no delete)       │
└─────────────────────────────────────────────────────────┘
```

### **Submitted/Approved Course:**
```
┌─────────────────────────────────────────────────────────┐
│ [Chờ duyệt] / [Đã duyệt] (blue/green chip)             │
│ Tên khóa học                                           │
│ ├─ [Sửa (disabled)] [Cấu trúc (disabled)] [Đang chờ admin xử lý (disabled)] │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Backend Logic

### **File:** `lms-backend/src/client/services/course.service.ts`

```typescript
// Submit for review logic
if (status === 'submit' || status === 'submitted') {
  const currentStatus = course.status || 'draft';
  
  // Only draft and published can submit
  if (currentStatus !== 'draft' && currentStatus !== 'published') {
    throw new Error('Only draft or published courses can be submitted for review');
  }

  if (currentStatus === 'published') {
    // Published course resubmission - allow multiple times
    updates.status = 'submitted';
    updates.submittedAt = new Date();
    updates.submittedForReview = true;
    updates.isPublished = false; // Unpublish when resubmitting
  } else {
    // Draft course - one-time submission only
    if (course.submittedForReview === true || course.submittedAt) {
      throw new Error('This course has already been submitted for review. You can only submit each course once.');
    }
    
    updates.status = 'submitted';
    updates.submittedAt = new Date();
    updates.submittedForReview = true;
  }
}
```

---

## ⚠️ Warning Dialogs

### **Draft Course Submit:**
```
⚠️ XÁC NHẬN GỬI DUYỆT

Bạn có chắc chắn muốn gửi khóa học "..." cho admin duyệt không?

LƯU Ý QUAN TRỌNG:
• Mỗi khóa học DRAFT CHỈ ĐƯỢC GỬI DUYỆT 1 LẦN DUY NHẤT
• Sau khi gửi, bạn KHÔNG THỂ RÚT LẠI hoặc GỬI LẠI
• Bạn sẽ không thể chỉnh sửa cho đến khi admin phản hồi
• Hãy đảm bảo nội dung khóa học đã hoàn thiện trước khi gửi

Tiếp tục?
```

### **Published Course Resubmit:**
```
⚠️ XÁC NHẬN GỬI DUYỆT

Bạn có chắc chắn muốn gửi khóa học "..." cho admin duyệt không?

LƯU Ý QUAN TRỌNG:
• Khóa học đã xuất bản sẽ được tạm ngưng cho đến khi admin duyệt lại
• Bạn có thể gửi lại nhiều lần sau khi chỉnh sửa
• Bạn sẽ không thể chỉnh sửa cho đến khi admin phản hồi
• Hãy đảm bảo nội dung khóa học đã hoàn thiện trước khi gửi

Tiếp tục?
```

---

## 📊 Database Fields

| Field | Draft Submit | Published Resubmit |
|-------|-------------|-------------------|
| `status` | `'submitted'` | `'submitted'` |
| `submittedForReview` | `true` (permanent) | `true` (permanent) |
| `submittedAt` | `Date` (permanent) | `Date` (updated) |
| `isPublished` | `false` | `false` (unpublished) |

---

## 🎯 Use Cases

### ✅ **Case 1: Teacher tạo khóa mới**
```
1. Tạo khóa → draft
2. Chỉnh sửa content
3. Click "Gửi duyệt" → submitted ✅
4. Admin approve → approved
5. Admin publish → published
```

### ✅ **Case 2: Teacher sửa khóa đã publish**
```
1. Khóa published
2. Teacher click "Sửa" → edit content
3. Teacher click "Gửi lại duyệt" → submitted ✅
4. Admin approve → approved
5. Admin publish → published (again)
```

### ❌ **Case 3: Teacher thử gửi draft lần 2**
```
1. Khóa đã submitted
2. Teacher try "Gửi duyệt" again
3. Backend reject: "already been submitted" ❌
```

### ✅ **Case 4: Teacher sửa cấu trúc published**
```
1. Khóa published
2. Teacher click "Cấu trúc" → edit structure
3. Teacher click "Gửi lại duyệt" → submitted ✅
4. Admin approve → approved
5. Admin publish → published (updated)
```

---

## 🔧 Admin Actions

Admin có thể:
- ✅ **Approve** → Status: `approved`
- ✅ **Reject** → Status: `rejected` (teacher có thể sửa và gửi lại)
- ✅ **Publish** → Status: `published`
- ✅ **Unpublish** → Status: `draft` (teacher có thể sửa và gửi lại)

---

## 🚀 Testing

### **Test 1: Draft workflow**
```bash
1. Create draft course
2. Submit → should work ✅
3. Try submit again → should fail ❌
4. Admin approve → approved
5. Admin publish → published
```

### **Test 2: Published resubmit workflow**
```bash
1. Published course
2. Edit content
3. Resubmit → should work ✅
4. Admin approve → approved
5. Admin publish → published (updated)
```

### **Test 3: Structure editing**
```bash
1. Published course
2. Edit structure → should work ✅
3. Resubmit → should work ✅
```

---

## 📝 Summary

| Course Status | Can Edit? | Can Structure? | Can Submit? | Can Delete? |
|---------------|-----------|----------------|-------------|-------------|
| `draft` | ✅ | ✅ | ✅ (1 lần) | ✅ |
| `submitted` | ❌ | ❌ | ❌ | ❌ |
| `approved` | ❌ | ❌ | ❌ | ❌ |
| `published` | ✅ | ✅ | ✅ (nhiều lần) | ❌ |
| `rejected` | ✅ | ✅ | ✅ (1 lần) | ✅ |

---

## 🔗 Related Files

- Backend Service: `lms-backend/src/client/services/course.service.ts`
- Frontend UI: `lms-frontend/src/pages/client/Teacher/CourseStudio/CourseStudio.tsx`
- Course Model: `lms-backend/src/shared/models/core/Course.ts`
- Admin Service: `lms-backend/src/admin/services/course.service.ts`
