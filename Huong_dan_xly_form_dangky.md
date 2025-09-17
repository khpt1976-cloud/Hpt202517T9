# 📋 HƯỚNG DẪN XỬ LÝ FORM ĐĂNG KÝ BOTPRESS

## 🔍 1. CHẨN ĐOÁN VẤN ĐỀ

### Triệu chứng:
- ❌ Form đăng ký Botpress không hiển thị
- ❌ Trang web hiển thị "Bad Gateway" hoặc lỗi kết nối
- ❌ Khách hàng không thể tạo tài khoản admin

### Nguyên nhân chính:
- 🔸 Botpress đã có workspace và database từ lần chạy trước
- 🔸 File `workspaces.json` đã tồn tại → Botpress bỏ qua form đăng ký ban đầu
- 🔸 Cấu hình host/port không đúng
- 🔸 `allowSelfSignup` bị tắt

### Cách nhận biết:
```bash
# Kiểm tra file workspace
ls -la data/global/workspaces.json

# Kiểm tra database
ls -la data/storage/core.sqlite

# Nếu 2 file này tồn tại → Form đăng ký sẽ KHÔNG hiển thị
```

---

## 🛠️ 2. GIẢI PHÁP CHI TIẾT

### BƯỚC 1: Dừng Botpress Service
```bash
# Tìm process Botpress đang chạy
ps aux | grep bp | grep -v grep

# Dừng tất cả process Botpress
pkill -f "bp start"

# Xác nhận đã dừng
ps aux | grep bp | grep -v grep
```

### BƯỚC 2: Xóa Database Files
```bash
# Di chuyển vào thư mục Botpress
cd /workspace/ChotKhung8T9/botpressV12Chuan

# Xóa workspace file (QUAN TRỌNG NHẤT)
rm -f data/global/workspaces.json

# Xóa database SQLite
rm -f data/storage/core.sqlite

# Xóa config cũ (nếu cần reset hoàn toàn)
rm -f data/global/botpress.config.json

# Kiểm tra đã xóa thành công
ls -la data/global/
ls -la data/storage/
```

### BƯỚC 3: Cấu hình botpress.config.json
```bash
# Nếu file config không tồn tại, Botpress sẽ tự tạo
# Sau khi khởi động lần đầu, sửa file config:

# Sửa host và port
sed -i 's/"host": "localhost"/"host": "0.0.0.0"/g' data/global/botpress.config.json
sed -i 's/"port": 3000/"port": 12001/g' data/global/botpress.config.json

# Sửa external URL
sed -i 's/"externalUrl": ""/"externalUrl": "https:\/\/work-2-dcbxiupofzmhkjoy.prod-runtime.all-hands.dev"/g' data/global/botpress.config.json

# Bật self signup
sed -i 's/"allowSelfSignup": false/"allowSelfSignup": true/g' data/global/botpress.config.json

# Sửa modules path
sed -i 's|MODULES_ROOT|./modules|g' data/global/botpress.config.json
```

### BƯỚC 4: Khởi động lại Botpress
```bash
# Khởi động Botpress với config mới
cd /workspace/ChotKhung8T9/botpressV12Chuan
nohup ./bp start > botpress.log 2>&1 &

# Theo dõi log khởi động
tail -f botpress.log

# Kiểm tra process đang chạy
ps aux | grep bp | grep -v grep
```

---

## ✅ 3. KIỂM TRA KẾT QUẢ

### Dấu hiệu thành công:
```bash
# Log sẽ hiển thị:
# Botpress is listening at http://0.0.0.0:12001 (browser)
# Botpress is exposed at https://work-2-dcbxiupofzmhkjoy.prod-runtime.all-hands.dev
# Studio is listening at: http://localhost:4009
```

### Truy cập form đăng ký:
- 🌐 **URL:** https://work-2-dcbxiupofzmhkjoy.prod-runtime.all-hands.dev
- 📝 **Form hiển thị:**
  - Tiêu đề: "Register"
  - Text: "This is the first time you run Botpress. Please create the master admin account."
  - 3 trường: E-mail, Password, Confirm Password
  - Nút: "Create Account"

---

## 🚨 4. CÁC FILE QUAN TRỌNG CẦN XÓA

| File | Đường dẫn | Mục đích |
|------|-----------|----------|
| `workspaces.json` | `data/global/workspaces.json` | **QUAN TRỌNG NHẤT** - Chứa thông tin workspace |
| `core.sqlite` | `data/storage/core.sqlite` | Database chính của Botpress |
| `botpress.config.json` | `data/global/botpress.config.json` | Config file (xóa nếu muốn reset hoàn toàn) |

### ⚠️ LƯU Ý:
- **BACKUP** dữ liệu quan trọng trước khi xóa
- Chỉ xóa khi cần **RESET HOÀN TOÀN**
- File `workspaces.json` là file **QUAN TRỌNG NHẤT** cần xóa

---

## 🔧 5. CẤU HÌNH QUAN TRỌNG

### Trong file `botpress.config.json`:
```json
{
  "httpServer": {
    "host": "0.0.0.0",           // ← QUAN TRỌNG: Cho phép truy cập từ bên ngoài
    "port": 12001,               // ← Port đúng với environment
    "externalUrl": "https://work-2-dcbxiupofzmhkjoy.prod-runtime.all-hands.dev"
  },
  "authStrategies": {
    "default": {
      "allowSelfSignup": true    // ← QUAN TRỌNG: Cho phép đăng ký
    }
  },
  "modules": [
    {
      "location": "./modules/analytics",  // ← Đường dẫn modules đúng
      "enabled": true
    }
    // ... các modules khác
  ]
}
```

---

## 🚨 6. TROUBLESHOOTING

### Vấn đề 1: "Bad Gateway"
**Nguyên nhân:** Botpress chưa khởi động hoặc port sai
```bash
# Kiểm tra process
ps aux | grep bp

# Kiểm tra log
tail -20 botpress.log

# Khởi động lại
pkill -f "bp start"
nohup ./bp start > botpress.log 2>&1 &
```

### Vấn đề 2: Form vẫn không hiển thị
**Nguyên nhân:** File `workspaces.json` vẫn tồn tại
```bash
# Kiểm tra file
ls -la data/global/workspaces.json

# Xóa và khởi động lại
rm -f data/global/workspaces.json
pkill -f "bp start"
nohup ./bp start > botpress.log 2>&1 &
```

### Vấn đề 3: Modules không load
**Nguyên nhân:** Đường dẫn modules sai
```bash
# Kiểm tra modules tồn tại
ls -la modules/

# Sửa config
sed -i 's|MODULES_ROOT|./modules|g' data/global/botpress.config.json
```

### Vấn đề 4: Port conflict
**Nguyên nhân:** Port 12001 đã được sử dụng
```bash
# Kiểm tra port
netstat -tulpn | grep 12001

# Kill process sử dụng port
sudo fuser -k 12001/tcp
```

---

## 📋 7. CHECKLIST THỰC HIỆN

### Trước khi bắt đầu:
- [ ] Backup dữ liệu quan trọng
- [ ] Xác nhận có quyền truy cập server
- [ ] Kiểm tra Botpress đang chạy

### Các bước thực hiện:
- [ ] **Bước 1:** Dừng Botpress service
- [ ] **Bước 2:** Xóa `workspaces.json`
- [ ] **Bước 3:** Xóa `core.sqlite`
- [ ] **Bước 4:** Cấu hình `botpress.config.json`
- [ ] **Bước 5:** Khởi động lại Botpress
- [ ] **Bước 6:** Kiểm tra log khởi động
- [ ] **Bước 7:** Truy cập URL và xác nhận form hiển thị

### Sau khi hoàn thành:
- [ ] Form đăng ký hiển thị đúng
- [ ] Có thể tạo tài khoản admin
- [ ] Botpress hoạt động bình thường
- [ ] Cập nhật tài liệu cho team

---

## 📞 8. LIÊN HỆ HỖ TRỢ

Nếu gặp vấn đề không giải quyết được:
1. Thu thập log: `tail -50 botpress.log`
2. Chụp screenshot lỗi
3. Ghi lại các bước đã thực hiện
4. Liên hệ team kỹ thuật

---

## 📝 9. LỊCH SỬ CẬP NHẬT

| Ngày | Phiên bản | Thay đổi |
|------|-----------|----------|
| 07/09/2025 | v1.0 | Tạo tài liệu ban đầu |
| 07/09/2025 | v1.1 | Thêm troubleshooting chi tiết |

---

**🎯 Mục tiêu:** Đảm bảo form đăng ký Botpress luôn hiển thị đúng cho khách hàng mới.

**⚡ Thời gian thực hiện:** 5-10 phút

**🔒 Độ an toàn:** Cao (chỉ reset database, không ảnh hưởng code)