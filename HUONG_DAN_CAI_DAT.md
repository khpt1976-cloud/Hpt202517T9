# 🚀 HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG QUẢN LÝ THI CÔNG XÂY DỰNG

## 📋 Tổng quan
Hệ thống quản lý nhật ký thi công xây dựng với giao diện hiện đại, được xây dựng trên Next.js 14 và Prisma ORM.

## 🔧 Yêu cầu hệ thống

### Phần mềm cần thiết:
- **Node.js**: Phiên bản 18.0 trở lên
- **npm**: Phiên bản 8.0 trở lên (đi kèm với Node.js)
- **Git**: Để clone repository

### Hệ điều hành hỗ trợ:
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+
- CentOS 7+

## 📥 BƯỚC 1: Tải xuống mã nguồn

### Cách 1: Clone từ GitHub
```bash
git clone https://github.com/khpt1976-cloud/Hpt202517T9.git
cd Hpt202517T9
```

### Cách 2: Tải file ZIP
1. Truy cập: https://github.com/khpt1976-cloud/Hpt202517T9
2. Click nút "Code" → "Download ZIP"
3. Giải nén file và mở terminal tại thư mục

## 🛠️ BƯỚC 2: Cài đặt Node.js

### Windows:
1. Tải Node.js từ: https://nodejs.org/
2. Chạy file .msi và làm theo hướng dẫn
3. Mở Command Prompt và kiểm tra:
```cmd
node --version
npm --version
```

### macOS:
```bash
# Sử dụng Homebrew
brew install node

# Hoặc tải từ nodejs.org
```

### Ubuntu/Debian:
```bash
# Cập nhật package list
sudo apt update

# Cài đặt Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

### CentOS/RHEL:
```bash
# Cài đặt Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

## 📦 BƯỚC 3: Cài đặt dependencies

```bash
# Di chuyển vào thư mục dự án
cd Hpt202517T9

# Cài đặt tất cả dependencies
npm install
```

**Lưu ý**: Quá trình này có thể mất 2-5 phút tùy vào tốc độ mạng.

## 🗄️ BƯỚC 4: Thiết lập cơ sở dữ liệu

Dự án sử dụng SQLite (không cần cài đặt thêm) với Prisma ORM.

```bash
# Tạo cơ sở dữ liệu và bảng
npx prisma db push

# Tạo dữ liệu mẫu
npm run db:seed
```

## 🚀 BƯỚC 5: Chạy ứng dụng

### Chế độ Development:
```bash
npm run dev
```

### Chế độ Production:
```bash
# Build ứng dụng
npm run build

# Chạy production server
npm start
```

## 🌐 BƯỚC 6: Truy cập ứng dụng

Sau khi chạy thành công, mở trình duyệt và truy cập:
- **Development**: http://localhost:3000
- **Production**: http://localhost:3000

## 👥 Tài khoản mặc định

Hệ thống được tạo sẵn các tài khoản sau:

| Username | Email | Role | Mật khẩu |
|----------|-------|------|----------|
| admin | admin@example.com | ADMIN | (Cần thiết lập) |
| manager1 | manager1@example.com | MANAGER | (Cần thiết lập) |
| editor1 | editor1@example.com | EDITOR | (Cần thiết lập) |

## 🔧 Cấu hình nâng cao

### Thay đổi cổng (Port):
Chỉnh sửa file `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 8080"
  }
}
```

### Cấu hình môi trường:
Tạo file `.env.local` (tùy chọn):
```env
# Database (mặc định sử dụng SQLite)
DATABASE_URL="file:./dev.db"

# Upload settings
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10MB"

# OnlyOffice (tùy chọn)
NEXT_PUBLIC_ONLYOFFICE_SERVER_URL="http://localhost:8080"
```

## 📁 Cấu trúc thư mục

```
Hpt202517T9/
├── app/                    # Next.js App Router
│   ├── construction-reports/   # Module quản lý báo cáo
│   ├── api/               # API endpoints
│   └── globals.css        # Styles toàn cục
├── components/            # React components
├── lib/                   # Utilities và helpers
├── prisma/               # Database schema và migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Dữ liệu mẫu
├── public/               # Static files
├── package.json          # Dependencies và scripts
└── README.md            # Tài liệu dự án
```

## 🛠️ Scripts hữu ích

```bash
# Chạy development server
npm run dev

# Build production
npm run build

# Chạy production server
npm start

# Chạy tests
npm test

# Lint code
npm run lint

# Database commands
npm run db:generate    # Tạo Prisma client
npm run db:push       # Đồng bộ schema với database
npm run db:seed       # Tạo dữ liệu mẫu
npm run db:studio     # Mở Prisma Studio
npm run db:reset      # Reset database và seed lại
```

## 🐛 Xử lý sự cố

### Lỗi thường gặp:

#### 1. "Port 3000 is already in use"
```bash
# Tìm và kill process đang sử dụng port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 2. "Module not found"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

#### 3. "Database connection error"
```bash
# Reset database
npm run db:reset
```

#### 4. "Permission denied" (Linux/macOS)
```bash
# Cấp quyền cho thư mục
chmod -R 755 .
```

### Kiểm tra logs:
```bash
# Xem logs chi tiết
DEBUG=* npm run dev
```

## 🔒 Bảo mật

### Trong môi trường Production:
1. Thay đổi tất cả mật khẩu mặc định
2. Cấu hình HTTPS
3. Thiết lập firewall
4. Backup database định kỳ
5. Cập nhật dependencies thường xuyên

### Backup database:
```bash
# Backup SQLite database
cp prisma/dev.db backup/dev_backup_$(date +%Y%m%d).db
```

## 📞 Hỗ trợ

### Liên hệ:
- **Developer**: khpt1976-cloud
- **GitHub**: https://github.com/khpt1976-cloud/Hpt202517T9
- **Issues**: https://github.com/khpt1976-cloud/Hpt202517T9/issues

### Tài liệu tham khảo:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)

## 📈 Cập nhật

### Cập nhật từ GitHub:
```bash
git pull origin main
npm install
npm run db:push
```

### Kiểm tra phiên bản mới:
```bash
npm outdated
```

---

## ✅ Checklist cài đặt

- [ ] Đã cài đặt Node.js 18+
- [ ] Đã clone/tải mã nguồn
- [ ] Đã chạy `npm install` thành công
- [ ] Đã thiết lập database với `npm run db:push`
- [ ] Đã tạo dữ liệu mẫu với `npm run db:seed`
- [ ] Đã chạy `npm run dev` thành công
- [ ] Có thể truy cập http://localhost:3000
- [ ] Đã kiểm tra các chức năng cơ bản

**🎉 Chúc mừng! Bạn đã cài đặt thành công hệ thống quản lý thi công xây dựng.**