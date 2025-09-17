# 🔧 Hướng Dẫn Sửa Khi Cài Trên Máy Chủ

## ⚠️ **VẤN ĐỀ CHÍNH:**
Khi anh deploy code lên máy chủ thật, **URL sẽ khác hoàn toàn** so với môi trường development. Cần sửa 2 files chính để AdminBot hoạt động đúng.

---

## 🎯 **CÁC FILE CẦN SỬA:**

### **1. File: `/app/page.tsx`** 
**📍 Vị trí:** Dòng 208 - Sửa URL AdminBot

**🔍 TÌM DÒNG NÀY:**
```typescript
onClick={() => window.open('https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev/', '_blank')}
```

**✏️ SỬA THÀNH:**
```typescript
// Thay bằng domain thật của anh:
onClick={() => window.open('https://domain-cua-anh.com:12001/', '_blank')}

// HOẶC nếu dùng IP:
onClick={() => window.open('https://123.456.789.123:12001/', '_blank')}

// HOẶC nếu dùng subdomain:
onClick={() => window.open('https://botpress.domain-cua-anh.com/', '_blank')}
```

### **2. File: `/botpressV12Chuan/data/global/botpress.config.json`**
**📍 Vị trí:** Sửa `externalUrl`

**🔍 TÌM SECTION NÀY:**
```json
{
  "httpServer": {
    "host": "0.0.0.0", 
    "port": 12001,
    "cors": {
      "enabled": true,
      "origin": "*"
    },
    "headers": {
      "X-Frame-Options": "ALLOWALL"
    }
  },
  "externalUrl": "https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev:12001"
}
```

**✏️ SỬA DÒNG `externalUrl`:**
```json
// Thay bằng domain/IP thật:
"externalUrl": "https://domain-cua-anh.com:12001"

// HOẶC với IP:
"externalUrl": "https://123.456.789.123:12001"

// HOẶC với subdomain:
"externalUrl": "https://botpress.domain-cua-anh.com"
```

---

## 🌐 **CÁC TÌNH HUỐNG DEPLOY THƯỜNG GẶP:**

### **📋 Tình huống 1: Cùng domain, khác port**
```
Frontend:  https://mysite.com (port 80/443)  
Botpress:  https://mysite.com:12001
```
**Sửa:**
- `page.tsx`: `'https://mysite.com:12001/'`
- `botpress.config.json`: `"externalUrl": "https://mysite.com:12001"`

### **📋 Tình huống 2: Subdomain riêng**
```
Frontend:  https://mysite.com
Botpress:  https://bot.mysite.com
```
**Sửa:**
- `page.tsx`: `'https://bot.mysite.com/'`
- `botpress.config.json`: `"externalUrl": "https://bot.mysite.com"`

### **📋 Tình huống 3: Reverse proxy (khuyến nghị)**
```
Frontend:  https://mysite.com
Botpress:  https://mysite.com/botpress
```
**Sửa:**
- `page.tsx`: `'https://mysite.com/botpress/'`
- `botpress.config.json`: `"externalUrl": "https://mysite.com/botpress"`

### **📋 Tình huống 4: Chỉ có IP (không có domain)**
```
Frontend:  https://123.456.789.123:12000
Botpress:  https://123.456.789.123:12001
```
**Sửa:**
- `page.tsx`: `'https://123.456.789.123:12001/'`
- `botpress.config.json`: `"externalUrl": "https://123.456.789.123:12001"`

---

## 🔧 **HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC:**

### **Bước 1: Xác định domain/IP máy chủ**
```bash
# Kiểm tra IP public của máy chủ
curl ifconfig.me

# Hoặc nếu đã có domain
echo "mydomain.com"
```

### **Bước 2: Sửa file page.tsx**
```bash
# Mở file để sửa
nano app/page.tsx

# Tìm dòng 208 và thay thế URL
# Từ: 'https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev/'
# Thành: 'https://IP-HOẶC-DOMAIN-CỦA-ANH:12001/'
```

### **Bước 3: Sửa botpress.config.json**
```bash
# Mở file config
nano botpressV12Chuan/data/global/botpress.config.json

# Sửa dòng externalUrl
# Từ: "externalUrl": "https://work-2-uupefiiihztsmqzr.prod-runtime.all-hands.dev:12001"
# Thành: "externalUrl": "https://IP-HOẶC-DOMAIN-CỦA-ANH:12001"
```

### **Bước 4: Cấu hình firewall (nếu cần)**
```bash
# Mở port 12000 và 12001
sudo ufw allow 12000  # Frontend
sudo ufw allow 12001  # Botpress

# Kiểm tra status
sudo ufw status
```

### **Bước 5: Restart applications**
```bash
# Restart frontend
pm2 restart khung8t9

# Restart Botpress
cd botpressV12Chuan
./bp start
```

---

## ⚠️ **LƯU Ý QUAN TRỌNG:**

### **🔒 SSL Certificate:**
- Nếu dùng HTTPS, cần cert cho cả 2 ports (12000, 12001)
- Hoặc dùng reverse proxy với 1 cert duy nhất

### **🌐 CORS Settings:**
- Có thể cần sửa `origin` từ `"*"` thành domain cụ thể
- Ví dụ: `"origin": "https://yourdomain.com"`

### **🔥 Firewall:**
- Đảm bảo ports 12000, 12001 được mở
- Kiểm tra iptables và ufw

### **📡 DNS (nếu dùng subdomain):**
- Cần cấu hình DNS A record cho subdomain
- Ví dụ: `bot.yourdomain.com` → IP máy chủ

---

## 🔄 **QUY TRÌNH DEPLOY HOÀN CHỈNH:**

```bash
# 1. Clone code mới
git clone https://github.com/HptAI2025/ChotKhung8T9.git
cd ChotKhung8T9

# 2. Download Botpress binary
cd botpressV12Chuan
wget https://s3.amazonaws.com/botpress-binaries/botpress-v12_31_10-linux-x64.zip
unzip botpress-v12_31_10-linux-x64.zip
chmod +x bp
cd ..

# 3. Sửa URLs trong 2 files (như hướng dẫn trên)
nano app/page.tsx                                    # Dòng 208
nano botpressV12Chuan/data/global/botpress.config.json  # externalUrl

# 4. Cài dependencies
npm install

# 5. Build và chạy frontend (terminal 1)
npm run build
npm start -- --port 12000 --hostname 0.0.0.0

# 6. Chạy Botpress (terminal 2)
cd botpressV12Chuan  
./bp start
```

---

## 🆘 **TROUBLESHOOTING:**

### **❌ Vấn đề: AdminBot hiện trang trắng**
**✅ Giải pháp:** Kiểm tra URL trong `page.tsx` có đúng không

### **❌ Vấn đề: CORS errors**
**✅ Giải pháp:** Kiểm tra `botpress.config.json` có cấu hình CORS đúng không

### **❌ Vấn đề: Không kết nối được**
**✅ Giải pháp:** Kiểm tra firewall và ports 12000/12001

### **❌ Vấn đề: SSL certificate errors**
**✅ Giải pháp:** Cấu hình SSL cho cả 2 ports hoặc dùng reverse proxy

---

## 📞 **LIÊN HỆ HỖ TRỢ:**
Nếu gặp vấn đề, cung cấp thông tin:
- Domain/IP máy chủ
- Error messages
- Screenshots lỗi
- Cấu hình firewall hiện tại

**🎯 Mục tiêu:** AdminBot menu hoạt động hoàn hảo trên production!