# 🏗️ DuanHpt15T9 - Construction Management System

## 📋 Mô tả dự án
Hệ thống quản lý thi công xây dựng với giao diện hiện đại, được đơn giản hóa để loại bỏ chức năng template phức tạp.

## ✨ Tính năng chính

### 📝 Quản lý nhật ký thi công
- **Tạo nhật ký đơn giản**: Khởi tạo với 1 trang, tạo thêm dựa trên cấu hình form
- **Layout ảnh linh hoạt**: Hỗ trợ nhiều layout (1×1, 2×1, 2×2, 3×2, v.v.)
- **Quản lý trang**: Thêm/xóa trang, khóa/mở khóa trang
- **Lưu trữ tự động**: Auto-save và manual save

### 🖼️ Quản lý hình ảnh
- **Upload ảnh**: Drag & drop hoặc click để thêm ảnh
- **Layout tùy chỉnh**: Cấu hình số ảnh/trang và bố cục
- **Preview**: Xem trước layout trước khi tạo

### 💾 Lưu trữ và chia sẻ
- **Lưu làm thư viện**: Lưu template để tái sử dụng
- **Export**: Xuất file PDF/Word
- **Chia sẻ**: Chia sẻ nhật ký với team

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Database (PostgreSQL/MySQL)

### Cài đặt
```bash
# Clone repository
git clone https://github.com/khpt1976-cloud/DuanHpt15T9.git
cd DuanHpt15T9

# Cài đặt dependencies
npm install

# Cấu hình environment
cp .env.example .env.local
# Chỉnh sửa .env.local với thông tin database và API keys

# Chạy development server
npm run dev
```

### Truy cập ứng dụng
- **Development**: http://localhost:3000
- **Production**: Theo cấu hình deployment

## 📁 Cấu trúc dự án

```
DuanHpt15T9/
├── app/                          # Next.js App Router
│   ├── construction-reports/     # Module quản lý báo cáo thi công
│   │   ├── editor/              # Editor nhật ký thi công
│   │   └── page.tsx             # Danh sách báo cáo
│   ├── api/                     # API routes
│   └── globals.css              # Global styles
├── components/                   # Shared components
├── lib/                         # Utilities và helpers
├── public/                      # Static assets
└── README.md                    # Documentation
```

## 🔧 Cấu hình

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# OnlyOffice (Optional)
NEXT_PUBLIC_ONLYOFFICE_SERVER_URL="http://localhost:8080"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10MB"
```

## 📈 Cải tiến so với phiên bản trước

### ✅ Đã loại bỏ
- ❌ Template Word files phức tạp
- ❌ Logic template selection
- ❌ Template page calculation
- ❌ Template loading functions

### ✅ Đã đơn giản hóa
- ✅ **Page calculation**: Khởi tạo = 1 trang, tạo thêm = form-based
- ✅ **Create diary logic**: Chỉ dựa vào image configuration
- ✅ **UI/UX**: Loại bỏ template selection, focus vào image layout
- ✅ **Performance**: Giảm complexity, tăng tốc độ load

## 🐛 Troubleshooting

### Lỗi thường gặp
1. **Port đã được sử dụng**: Thay đổi port trong `package.json`
2. **Database connection**: Kiểm tra `DATABASE_URL` trong `.env.local`
3. **File upload**: Đảm bảo thư mục `uploads` có quyền write

### Debug mode
```bash
# Chạy với debug logs
DEBUG=* npm run dev

# Hoặc chỉ debug specific modules
DEBUG=construction:* npm run dev
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Developer**: khpt1976-cloud
- **Repository**: [https://github.com/khpt1976-cloud/DuanHpt15T9](https://github.com/khpt1976-cloud/DuanHpt15T9)

---

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] Loại bỏ template functionality
- [x] Đơn giản hóa page calculation
- [x] Cải thiện UI/UX create diary dialog

### Phase 2 (Planned) 🚧
- [ ] Cải thiện image upload performance
- [ ] Thêm image compression
- [ ] Mobile responsive optimization

### Phase 3 (Future) 🔮
- [ ] Real-time collaboration
- [ ] Advanced export options
- [ ] Integration với cloud storage