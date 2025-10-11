# 🎨 Modern UI Dialogs - Thay thế Alert cũ

## 🎯 Mục đích

Thay thế các `window.confirm()` và `window.alert()` cũ kỹ bằng Material-UI Dialog hiện đại và đẹp mắt.

---

## ✅ **ĐÃ THỰC HIỆN**

### **1️⃣ Import Dialog Components**
```typescript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
```

### **2️⃣ State Management**
```typescript
const [confirmDialog, setConfirmDialog] = useState<{
  open: boolean;
  title: string;
  content: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  severity: 'warning' | 'info' | 'error';
}>({
  open: false,
  title: '',
  content: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  onConfirm: () => {},
  severity: 'warning'
});
```

### **3️⃣ Dialog Component**
```typescript
<Dialog
  open={confirmDialog.open}
  onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
  aria-labelledby="confirm-dialog-title"
  aria-describedby="confirm-dialog-description"
  maxWidth="sm"
  fullWidth
>
  <DialogTitle 
    id="confirm-dialog-title"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      color: confirmDialog.severity === 'error' ? 'error.main' : 
             confirmDialog.severity === 'warning' ? 'warning.main' : 'info.main'
    }}
  >
    {confirmDialog.severity === 'error' && <DeleteIcon />}
    {confirmDialog.severity === 'warning' && <SendIcon />}
    {confirmDialog.severity === 'info' && <EditIcon />}
    {confirmDialog.title}
  </DialogTitle>
  <DialogContent>
    <DialogContentText 
      id="confirm-dialog-description"
      sx={{ 
        whiteSpace: 'pre-line',
        fontSize: '0.95rem',
        lineHeight: 1.6
      }}
    >
      {confirmDialog.content}
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 3, pt: 1 }}>
    <Button 
      onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
      variant="outlined"
    >
      {confirmDialog.cancelText}
    </Button>
    <Button 
      onClick={confirmDialog.onConfirm}
      variant="contained"
      color={confirmDialog.severity === 'error' ? 'error' : 'primary'}
      autoFocus
    >
      {confirmDialog.confirmText}
    </Button>
  </DialogActions>
</Dialog>
```

---

## 🎨 **UI FEATURES**

### **1️⃣ Dynamic Icons**
- **Error**: `DeleteIcon` (red)
- **Warning**: `SendIcon` (orange)  
- **Info**: `EditIcon` (blue)

### **2️⃣ Dynamic Colors**
- **Error**: Red theme
- **Warning**: Orange theme
- **Info**: Blue theme

### **3️⃣ Responsive Design**
- `maxWidth="sm"` - Medium size
- `fullWidth` - Responsive width
- Proper spacing and typography

### **4️⃣ Accessibility**
- `aria-labelledby` - Screen reader support
- `aria-describedby` - Content description
- `autoFocus` - Focus management

---

## 🔄 **USAGE EXAMPLES**

### **1️⃣ Delete Course Dialog**
```typescript
const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
  setConfirmDialog({
    open: true,
    title: 'Xác nhận xóa khóa học',
    content: `Bạn có chắc chắn muốn xóa khóa học "${courseTitle}"?\n\nHành động này không thể hoàn tác.`,
    confirmText: 'Xóa',
    cancelText: 'Hủy',
    severity: 'error',
    onConfirm: async () => {
      // Delete logic here
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  });
};
```

### **2️⃣ Submit for Review Dialog**
```typescript
const handleSubmitForReview = async (courseId: string, courseTitle: string) => {
  const isResubmission = course?.status === 'published';
  
  setConfirmDialog({
    open: true,
    title: isResubmission ? 'Xác nhận gửi lại duyệt' : 'Xác nhận gửi duyệt',
    content: isResubmission ? 
      `Bạn có chắc chắn muốn gửi lại khóa học "${courseTitle}" cho admin duyệt không?\n\n` +
      `LƯU Ý QUAN TRỌNG:\n` +
      `• Khóa học đã xuất bản sẽ được tạm ngưng cho đến khi admin duyệt lại\n` +
      `• Chỉ có thể gửi lại khi đã chỉnh sửa nội dung` :
      `Bạn có chắc chắn muốn gửi khóa học "${courseTitle}" cho admin duyệt không?\n\n` +
      `LƯU Ý QUAN TRỌNG:\n` +
      `• Mỗi khóa học DRAFT CHỈ ĐƯỢC GỬI DUYỆT 1 LẦN DUY NHẤT\n` +
      `• Sau khi gửi, bạn KHÔNG THỂ RÚT LẠI hoặc GỬI LẠI`,
    confirmText: isResubmission ? 'Gửi lại duyệt' : 'Gửi duyệt',
    cancelText: 'Hủy',
    severity: 'warning',
    onConfirm: async () => {
      // Submit logic here
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  });
};
```

---

## 📸 **VISUAL COMPARISON**

### **❌ OLD Alert (Browser Default):**
```
┌─────────────────────────────────────┐
│ JavaScript Alert                    │
├─────────────────────────────────────┤
│ Bạn có chắc chắn muốn xóa?          │
│                                     │
│ [OK] [Cancel]                       │
└─────────────────────────────────────┘
```

### **✅ NEW Dialog (Material-UI):**
```
┌─────────────────────────────────────┐
│ 🗑️ Xác nhận xóa khóa học           │
├─────────────────────────────────────┤
│ Bạn có chắc chắn muốn xóa khóa học │
│ "React Basics" không?               │
│                                     │
│ Hành động này không thể hoàn tác.   │
│                                     │
│                    [Hủy] [Xóa]      │
└─────────────────────────────────────┘
```

---

## 🎯 **BENEFITS**

### **1️⃣ User Experience**
- ✅ Modern, clean design
- ✅ Consistent with Material-UI theme
- ✅ Better typography and spacing
- ✅ Responsive on all devices

### **2️⃣ Developer Experience**
- ✅ TypeScript support
- ✅ Reusable component
- ✅ Easy to customize
- ✅ Better error handling

### **3️⃣ Accessibility**
- ✅ Screen reader support
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ ARIA labels

### **4️⃣ Branding**
- ✅ Consistent with app theme
- ✅ Professional appearance
- ✅ Custom icons and colors
- ✅ Better user trust

---

## 🔧 **CUSTOMIZATION**

### **1️⃣ Custom Severity Colors**
```typescript
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'error': return 'error.main';
    case 'warning': return 'warning.main';
    case 'info': return 'info.main';
    case 'success': return 'success.main';
    default: return 'primary.main';
  }
};
```

### **2️⃣ Custom Icons**
```typescript
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error': return <DeleteIcon />;
    case 'warning': return <WarningIcon />;
    case 'info': return <InfoIcon />;
    case 'success': return <CheckCircleIcon />;
    default: return <HelpIcon />;
  }
};
```

### **3️⃣ Custom Button Colors**
```typescript
const getButtonColor = (severity: string) => {
  switch (severity) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    case 'success': return 'success';
    default: return 'primary';
  }
};
```

---

## 🚀 **FUTURE ENHANCEMENTS**

### **1️⃣ Loading States**
```typescript
const [loading, setLoading] = useState(false);

<Button 
  onClick={confirmDialog.onConfirm}
  variant="contained"
  disabled={loading}
  startIcon={loading ? <CircularProgress size={16} /> : null}
>
  {confirmDialog.confirmText}
</Button>
```

### **2️⃣ Animation**
```typescript
<Dialog
  open={confirmDialog.open}
  TransitionComponent={Fade}
  TransitionProps={{ timeout: 300 }}
>
```

### **3️⃣ Multiple Actions**
```typescript
<DialogActions>
  <Button onClick={handleSaveDraft}>Lưu nháp</Button>
  <Button onClick={handleCancel}>Hủy</Button>
  <Button onClick={handleConfirm} variant="contained">Xác nhận</Button>
</DialogActions>
```

---

## 📝 **MIGRATION GUIDE**

### **Before (Alert):**
```typescript
if (window.confirm('Are you sure?')) {
  // Action
}
```

### **After (Dialog):**
```typescript
setConfirmDialog({
  open: true,
  title: 'Confirmation',
  content: 'Are you sure?',
  confirmText: 'Yes',
  cancelText: 'No',
  severity: 'warning',
  onConfirm: () => {
    // Action
    setConfirmDialog({ ...confirmDialog, open: false });
  }
});
```

---

## 🔗 **Related Files**

- Component: `lms-frontend/src/pages/client/Teacher/CourseStudio/CourseStudio.tsx`
- Types: `lms-frontend/src/types/index.ts`
- Theme: `lms-frontend/src/styles/theme.ts`
