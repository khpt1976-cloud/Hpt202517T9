# 🏗️ Hệ thống Quản lý Thi công Xây dựng

## 📋 Giới thiệu
Hệ thống quản lý nhật ký thi công xây dựng hiện đại với giao diện thân thiện, được xây dựng trên Next.js 14 và Prisma ORM.

## ✨ Tính năng chính

### 📝 Quản lý nhật ký thi công
- **Tạo nhật ký đơn giản**: Khởi tạo nhanh chóng với giao diện trực quan
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

## 🚀 Cài đặt nhanh

```bash
# Clone repository
git clone https://github.com/khpt1976-cloud/Hpt202517T9.git
cd Hpt202517T9

# Cài đặt dependencies
npm install

# Thiết lập database
npm run db:push
npm run db:seed

# Chạy ứng dụng
npm run dev
```

**📖 [Xem hướng dẫn cài đặt chi tiết](./HUONG_DAN_CAI_DAT.md)**

### Truy cập ứng dụng
- **Development**: http://localhost:3000

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