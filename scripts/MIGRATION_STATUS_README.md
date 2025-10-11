# Course Status Migration

## 📝 Mục đích

Script này dùng để cập nhật các khóa học CŨ không có field `status` (hoặc `status = null/undefined`) và gán status phù hợp dựa trên các flag hiện có (`isPublished`, `isApproved`).

## ⚠️ Tại sao cần Migration?

Khi thêm field `status` mới vào Course model, các khóa học đã tồn tại trong database **KHÔNG TỰ ĐỘNG** có field này. Điều này gây ra lỗi khi:

- Teacher submit khóa học: Validation `course.status !== 'draft'` fail vì `status = undefined`
- Admin filter khóa học: Query `{ status: 'submitted' }` không tìm thấy khóa học cũ
- Stats không chính xác: Count theo status không đếm được khóa học cũ

## 🔄 Logic Migration

Script sẽ xác định status dựa trên flags hiện có:

| isPublished | isApproved | → New Status |
|-------------|------------|--------------|
| `true`      | `true`     | `published`  |
| `false`     | `true`     | `approved`   |
| `true`      | `false`    | `submitted`  |
| `false`     | `false`    | `draft`      |

## 🚀 Cách chạy

### Windows Command Prompt:
```cmd
cd lms-backend
scripts\migrate-status.cmd
```

### PowerShell:
```powershell
cd lms-backend
.\scripts\migrate-status.ps1
```

### Node.js trực tiếp:
```bash
cd lms-backend
node scripts/migrate-course-status.js
```

## 📊 Output mẫu

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Found 15 courses without status field
✅ Updated course: Introduction to React → published
✅ Updated course: Advanced TypeScript → draft
✅ Updated course: Node.js Basics → submitted
...

📈 Migration Summary:
   ✅ Successfully updated: 15 courses
   ❌ Errors: 0 courses
   📊 Total processed: 15 courses

✅ Migration completed successfully
```

## ⚠️ Lưu ý

1. **Backup database trước khi chạy**
2. Script **SAFE** - chỉ update các khóa học không có status
3. Có thể chạy nhiều lần mà không sợ duplicate update
4. Tự động đóng kết nối MongoDB sau khi xong

## 🔍 Kiểm tra sau khi migrate

```bash
# Vào MongoDB shell
mongosh

# Sử dụng database
use lms_database

# Check các khóa học không có status
db.courses.find({ status: { $exists: false } }).count()
# → Kết quả phải là 0

# Check phân bố status
db.courses.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra `MONGODB_URI` trong `.env`

### Lỗi: "Cannot find module"
- Chạy `npm install` trước

### Migration không update course nào
- Tất cả courses đã có status rồi ✅
- Hoặc không có courses nào trong database

## 📚 Related Files

- `lms-backend/src/shared/models/core/Course.ts` - Course model definition
- `lms-backend/src/client/services/course.service.ts` - Status update logic
- `lms-backend/src/admin/services/course.service.ts` - Admin course queries
