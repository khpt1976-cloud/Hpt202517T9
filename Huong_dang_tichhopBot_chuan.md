# 🤖 HƯỚNG DẪN TÍCH HỢP ADMINBOT VÀO KHUNG8T9

## 📋 TỔNG QUAN
Tích hợp thành công Botpress V12 vào hệ thống Khung8T9 với menu AdminBot trong dropdown Admin.

## 🚀 CÁC BƯỚC ĐÃ THỰC HIỆN

### 1. SETUP DỰ ÁN KHUNG8T9
```bash
# Clone repository
git clone https://github.com/HptAI2025/Khung8T9.git
cd Khung8T9

# Cài đặt dependencies
npm install

# Chạy trên port 12000
npm run dev -- --port 12000 --host 0.0.0.0
```

### 2. SETUP BOTPRESS V12
```bash
# Clone Botpress V12
git clone <botpress-v12-repo>
cd botpressV12Chuan

# Cài đặt và chạy
npm install
./bp start --port 12001 --host 0.0.0.0
```

### 3. CẤU HÌNH BOTPRESS
**File: `/workspace/botpressV12Chuan/data/global/botpress.config.json`**
```json
{
  "httpServer": {
    "host": "0.0.0.0",
    "port": 12001,
    "backlog": 511,
    "bodyLimit": "10mb",
    "cors": {
      "enabled": true,
      "origin": "*"
    },
    "headers": {
      "X-Frame-Options": "ALLOWALL"
    }
  },
  "externalUrl": "https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev"
}
```

### 4. TÍCH HỢP ADMINBOT MENU
**File: `/workspace/Khung8T9/app/page.tsx`**

Thêm import Bot icon:
```tsx
import { Bot, Shield, Users, Settings, ChevronDown } from 'lucide-react'
```

Thêm AdminBot menu item trong Admin dropdown:
```tsx
<DropdownMenuItem
  className="flex items-center space-x-2 text-slate-300 hover:text-orange-400 hover:bg-slate-700 cursor-pointer"
  onClick={() => window.open('https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev/', '_blank')}
>
  <Bot className="w-4 h-4" />
  <span>AdminBot</span>
</DropdownMenuItem>
```

## 🔧 CẤU HÌNH QUAN TRỌNG

### URLs
- **Khung8T9:** https://work-1-uupefiiihztsmqzr.prod-runtime.all-hands.dev (port 12000)
- **Botpress:** https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev (port 12001)

### Ports
- **Khung8T9:** 12000
- **Botpress:** 12001

### CORS & Headers
- `X-Frame-Options: ALLOWALL` - Cho phép iframe
- `cors.origin: "*"` - Cho phép tất cả origins
- `host: "0.0.0.0"` - Cho phép truy cập từ bên ngoài

## ✅ CÁCH SỬ DỤNG

1. **Truy cập Khung8T9:** https://work-1-uupefiiihztsmqzr.prod-runtime.all-hands.dev
2. **Đăng nhập Facebook** 
3. **Click menu Admin** (góc trái màn hình)
4. **Chọn AdminBot** từ dropdown
5. **Botpress sẽ mở trong tab mới** với form đăng ký admin

## 🐛 TROUBLESHOOTING

### Vấn đề: Trang trắng khi mở AdminBot
**Nguyên nhân:** URL `/admin/register` có vấn đề với React routing
**Giải pháp:** Đã thay đổi thành root URL `/`

### Vấn đề: CORS errors
**Giải pháp:** Đã cấu hình `cors.origin: "*"` và `X-Frame-Options: ALLOWALL`

### Vấn đề: Không thể truy cập từ bên ngoài
**Giải pháp:** Đã cấu hình `host: "0.0.0.0"` cho cả 2 services

## 📁 CẤU TRÚC FILE

```
/workspace/
├── Khung8T9/
│   ├── app/page.tsx (đã thêm AdminBot menu)
│   └── package.json
├── botpressV12Chuan/
│   ├── data/global/botpress.config.json (đã cấu hình)
│   └── bp (executable)
└── ADMINBOT_INTEGRATION_GUIDE.md (file này)
```

## 🎯 KẾT QUẢ

✅ **AdminBot menu hiển thị trong Admin dropdown**
✅ **Click AdminBot mở Botpress trong tab mới**  
✅ **Botpress load form đăng ký admin thành công**
✅ **Tích hợp hoàn tất và hoạt động ổn định**

## 🔄 DEPLOY PRODUCTION

Để deploy lên production:

1. **Thay đổi URLs** trong code thành domain thực tế
2. **Cấu hình reverse proxy** cho 2 ports
3. **Setup SSL certificates** 
4. **Cấu hình firewall** cho ports 12000, 12001
5. **Setup process manager** (PM2) để auto-restart

## 👨‍💻 DEVELOPER NOTES

- **Botpress V12** chạy ổn định trên Node.js
- **React routing** có thể gây vấn đề với deep links
- **CORS configuration** rất quan trọng cho iframe
- **Root URL** hoạt động tốt hơn specific routes

---
**Tích hợp thành công bởi OpenHands AI Assistant** 🤖
**Ngày:** 2025-09-07