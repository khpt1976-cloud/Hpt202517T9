# Hướng Dẫn Sửa Lỗi Page Configuration Isolation

## 📋 Tổng Quan

**Vấn đề:** Khi tạo trang mới trong Construction Reports Editor, trang cũ bị thay đổi cấu hình theo trang mới.

**Nguyên nhân:** Global state được sử dụng chung cho tất cả các trang, khiến việc thay đổi cấu hình ở một trang ảnh hưởng đến các trang khác.

**Giải pháp:** Lưu trữ cấu hình riêng cho từng trang trong `imagePagesConfig` object.

## 🔍 Phân Tích Lỗi

### Trước khi sửa:
```typescript
// Global state - được dùng chung cho tất cả trang
const [marginLeft, setMarginLeft] = useState(50);
const [marginRight, setMarginRight] = useState(50);
const [marginBottom, setMarginBottom] = useState(50);
const [marginHeader, setMarginHeader] = useState(100);
const [imageAspectRatio, setImageAspectRatio] = useState(1.414);
const [centerHorizontally, setCenterHorizontally] = useState(true);

// imagePagesConfig chỉ lưu images
const [imagePagesConfig, setImagePagesConfig] = useState<{
  [key: number]: { images: ImageItem[] }
}>({});
```

### Vấn đề:
- Khi chuyển trang, global state không thay đổi
- Khi tạo trang mới, global state được áp dụng cho trang mới
- Trang cũ không giữ được cấu hình riêng

## 🛠️ Cách Sửa

### Bước 1: Mở rộng Interface imagePagesConfig

```typescript
// Mở rộng để lưu trữ cấu hình đầy đủ cho từng trang
const [imagePagesConfig, setImagePagesConfig] = useState<{
  [key: number]: { 
    images: ImageItem[];
    marginLeft: number;
    marginRight: number;
    marginBottom: number;
    marginHeader: number;
    imageAspectRatio: number;
    centerHorizontally: boolean;
  }
}>({});
```

### Bước 2: Sửa Logic Tạo Trang Mới

**Trước:**
```typescript
const handleCreateDiary = () => {
  const newPageNumber = Math.max(...Object.keys(imagePagesConfig).map(Number), 0) + 1;
  setImagePagesConfig(prev => ({
    ...prev,
    [newPageNumber]: { images: [] } // Chỉ lưu images
  }));
  setCurrentPage(newPageNumber);
};
```

**Sau:**
```typescript
const handleCreateDiary = () => {
  const newPageNumber = Math.max(...Object.keys(imagePagesConfig).map(Number), 0) + 1;
  setImagePagesConfig(prev => ({
    ...prev,
    [newPageNumber]: { 
      images: [],
      marginLeft: 50,        // Cấu hình mặc định
      marginRight: 50,
      marginBottom: 50,
      marginHeader: 100,
      imageAspectRatio: 1.414,
      centerHorizontally: true
    }
  }));
  setCurrentPage(newPageNumber);
};
```

### Bước 3: Sửa Logic Render

**Trước:**
```typescript
// Sử dụng global state
<ImageGridEditor
  marginLeft={marginLeft}
  marginRight={marginRight}
  marginBottom={marginBottom}
  marginHeader={marginHeader}
  imageAspectRatio={imageAspectRatio}
  centerHorizontally={centerHorizontally}
  // ...
/>
```

**Sau:**
```typescript
// Sử dụng cấu hình riêng của từng trang
const currentPageConfig = imagePagesConfig[currentPage];

<ImageGridEditor
  marginLeft={currentPageConfig?.marginLeft || 50}
  marginRight={currentPageConfig?.marginRight || 50}
  marginBottom={currentPageConfig?.marginBottom || 50}
  marginHeader={currentPageConfig?.marginHeader || 100}
  imageAspectRatio={currentPageConfig?.imageAspectRatio || 1.414}
  centerHorizontally={currentPageConfig?.centerHorizontally || true}
  // ...
/>
```

### Bước 4: Cập Nhật Tất Cả Hàm Tạo imagePagesConfig

```typescript
// Trong useEffect và các hàm khởi tạo
const initializePages = () => {
  const pages: { [key: number]: any } = {};
  
  for (let i = 1; i <= totalPages; i++) {
    pages[i] = {
      images: [],
      marginLeft: 50,
      marginRight: 50,
      marginBottom: 50,
      marginHeader: 100,
      imageAspectRatio: 1.414,
      centerHorizontally: true
    };
  }
  
  setImagePagesConfig(pages);
};
```

## 📁 File Cần Sửa

**File chính:** `app/construction-reports/editor/[reportId]/page.tsx`

## ✅ Kết Quả Sau Khi Sửa

1. **Mỗi trang có cấu hình độc lập:** Thay đổi cấu hình ở trang này không ảnh hưởng trang khác
2. **Trang mới có cấu hình mặc định:** Khi tạo trang mới, nó có cấu hình riêng
3. **Chuyển trang giữ nguyên cấu hình:** Khi chuyển qua lại giữa các trang, mỗi trang giữ nguyên cấu hình riêng

## 🧪 Cách Test

1. **Tạo trang mới:** Click "Thêm trang"
2. **Thay đổi cấu hình trang mới:** Điều chỉnh margin, aspect ratio, etc.
3. **Chuyển về trang cũ:** Kiểm tra trang cũ vẫn giữ nguyên cấu hình ban đầu
4. **Chuyển lại trang mới:** Kiểm tra trang mới vẫn giữ cấu hình đã thay đổi

## 🔧 Lưu Ý Kỹ Thuật

- **State Management:** Sử dụng object để lưu trữ cấu hình theo page number
- **Default Values:** Luôn có giá trị mặc định khi trang chưa có cấu hình
- **Memory Management:** Cấu hình được lưu trong memory, cần save vào database nếu muốn persistent

## 📝 Tóm Tắt Thay Đổi

| Thành Phần | Trước | Sau |
|------------|-------|-----|
| State Structure | Global state cho tất cả trang | Object lưu cấu hình theo trang |
| Page Creation | Chỉ tạo images array | Tạo đầy đủ cấu hình |
| Rendering | Dùng global state | Dùng cấu hình riêng từng trang |
| Isolation | Không có | Hoàn toàn độc lập |

---

**Tác giả:** OpenHands AI Assistant  
**Ngày tạo:** 17/09/2025  
**Phiên bản:** 1.0