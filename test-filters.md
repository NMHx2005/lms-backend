# 🧪 Test Filters API - Course Controller

## **📋 API Endpoint:**
```
GET /api/client/courses
```

## **🔍 Test Cases cho các Filters mới:**

### **1. Price Range Filter:**
```bash
# Miễn phí
curl "http://localhost:3000/api/client/courses?priceRange=free"

# Dưới 100.000đ
curl "http://localhost:3000/api/client/courses?priceRange=0-100000"

# 100.000đ - 500.000đ
curl "http://localhost:3000/api/client/courses?priceRange=100000-500000"

# 500.000đ - 1.000.000đ
curl "http://localhost:3000/api/client/courses?priceRange=500000-1000000"

# Trên 1.000.000đ
curl "http://localhost:3000/api/client/courses?priceRange=1000000+"
```

### **2. Rating Filter:**
```bash
# 4.5⭐ trở lên
curl "http://localhost:3000/api/client/courses?rating=4.5+"

# 4.0⭐ trở lên
curl "http://localhost:3000/api/client/courses?rating=4.0+"

# 3.5⭐ trở lên
curl "http://localhost:3000/api/client/courses?rating=3.5+"

# 3.0⭐ trở lên
curl "http://localhost:3000/api/client/courses?rating=3.0+"
```

### **3. Duration Filter:**
```bash
# Dưới 2 giờ
curl "http://localhost:3000/api/client/courses?duration=0-2"

# 2-5 giờ
curl "http://localhost:3000/api/client/courses?duration=2-5"

# 5-10 giờ
curl "http://localhost:3000/api/client/courses?duration=5-10"

# Trên 10 giờ
curl "http://localhost:3000/api/client/courses?duration=10+"
```

### **4. Kết hợp nhiều Filters:**
```bash
# Lĩnh vực IT + Cấp độ cơ bản + Miễn phí
curl "http://localhost:3000/api/client/courses?domain=IT&level=beginner&priceRange=free"

# Tìm kiếm "Python" + Rating 4.0+ + Dưới 5 giờ
curl "http://localhost:3000/api/client/courses?search=Python&rating=4.0+&duration=0-2"

# Sắp xếp theo giá thấp đến cao + Lĩnh vực Design
curl "http://localhost:3000/api/client/courses?sortBy=price&sortOrder=asc&domain=Design"
```

### **5. Pagination + Filters:**
```bash
# Trang 2, 6 items/trang, lĩnh vực Marketing
curl "http://localhost:3000/api/client/courses?page=2&limit=6&domain=Marketing"

# Trang 1, 10 items/trang, rating 4.5+ + sắp xếp theo đánh giá
curl "http://localhost:3000/api/client/courses?page=1&limit=10&rating=4.5+&sortBy=rating&sortOrder=desc"
```

## **🔧 Backend Implementation:**

### **Controller (course.controller.ts):**
- ✅ Xử lý `priceRange` → chuyển đổi thành `minPrice`, `maxPrice`, `isFree`
- ✅ Xử lý `rating` → chuyển đổi thành `minRating`
- ✅ Xử lý `duration` → chuyển đổi thành `minDuration`, `maxDuration`

### **Service (course.service.ts):**
- ✅ Query MongoDB với `averageRating` filter
- ✅ Query MongoDB với `totalDuration` filter
- ✅ Query MongoDB với `price` range filter

### **Interface (course.interface.ts):**
- ✅ `CourseSearchFilters` bao gồm `minRating`, `minDuration`, `maxDuration`

## **📱 Frontend Integration:**

### **Service (courses.service.ts):**
- ✅ Gửi đúng parameters: `priceRange`, `rating`, `duration`
- ✅ Mapping đúng với backend API

### **Component (Coures.tsx):**
- ✅ Gọi API khi filters thay đổi
- ✅ Không còn client-side filtering
- ✅ Backend xử lý tất cả filters

## **🎯 Expected Results:**

1. **Price Range Filter**: Trả về courses theo khoảng giá chính xác
2. **Rating Filter**: Trả về courses có rating >= giá trị được chọn
3. **Duration Filter**: Trả về courses theo thời lượng chính xác
4. **Combined Filters**: Tất cả filters hoạt động cùng lúc
5. **Pagination**: Hoạt động chính xác với filters

## **⚠️ Notes:**
- Backend xử lý tất cả filtering logic
- Frontend chỉ gửi parameters và hiển thị kết quả
- Performance tốt hơn vì không cần client-side filtering
- Database queries được tối ưu với MongoDB indexes
