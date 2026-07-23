# 🔐 Tài Khoản Demo - Kinderland

## 📋 Tổng Quan Hệ Thống

Website bán đồ chơi trẻ em **Kinderland** với 3 loại tài khoản:
1. **👨‍💼 Administrator** - Quản trị viên toàn hệ thống
2. **👷 Store Staff** - Nhân viên cửa hàng
3. **👤 Customer** - Khách hàng (chỉ khách đã đăng nhập mới được checkout)

---

## 1️⃣ ADMIN - Quản Trị Viên

### Thông tin đăng nhập:
```
Email:    admin@kinderland.vn
Password: admin123
```

### Quyền hạn:
✅ Quản lý sản phẩm (thêm, sửa, xóa)  
✅ Quản lý đơn hàng toàn hệ thống  
✅ Xem báo cáo doanh thu, thống kê  
✅ Quản lý kho hàng tất cả chi nhánh  
✅ Quản lý khuyến mãi và voucher  
✅ Quản lý danh mục và thương hiệu  

### Dashboard:
`/admin/dashboard`

### Thông tin tài khoản:
- Họ tên: Nguyễn Văn Admin
- ID: admin-1
- Role: admin

---

## 2️⃣ STAFF - Nhân Viên Cửa Hàng

### Option A: Nhân viên chi nhánh TP.HCM

```
Email:    staff1@kinderland.vn
Password: staff123
```

**Thông tin:**
- Họ tên: Trần Thị Nhân Viên
- ID: staff-1
- Chi nhánh: Kinderland Vincom Center Đồng Khởi (HCM)
- Store ID: store-1

### Option B: Nhân viên chi nhánh Hà Nội

```
Email:    staff2@kinderland.vn
Password: staff123
```

**Thông tin:**
- Họ tên: Lê Văn Thành
- ID: staff-2
- Chi nhánh: Kinderland Royal City Hà Nội
- Store ID: store-6

### Quyền hạn Staff:
✅ Kiểm tra kho hàng chi nhánh  
✅ Chuyển hàng giữa các chi nhánh  
✅ Quét QR tích điểm cho khách  
✅ Báo cáo hàng lỗi/hư hỏng  
✅ Xử lý đơn đổi trả  
✅ Xem đơn hàng chi nhánh  

### Dashboard:
`/staff/dashboard`

---

## 3️⃣ CUSTOMER - Khách Hàng

### Tài khoản chính (Recommended):

```
Email:    customer@kinderland.vn
Password: customer123
```

**Thông tin:**
- Họ tên: Nguyễn Thị Lan
- ID: customer-1
- Hạng thành viên: 👑 **GOLD** (Vàng)
- Điểm tích lũy: 1,500 điểm
- Số điện thoại: 0901234567
- Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh

### Tài khoản phụ #1:

```
Email:    lanhuong@gmail.com
Password: lanhuong123
```

**Thông tin:**
- Họ tên: Trần Lan Hương
- Hạng: 🥈 Silver
- Điểm: 750
- Địa chỉ: 45 Láng Hạ, Ba Đình, Hà Nội

### Tài khoản phụ #2:

```
Email:    minhtu@gmail.com
Password: minhtu123
```

**Thông tin:**
- Họ tên: Lê Minh Tú
- Hạng: 🥉 Bronze
- Điểm: 250
- Địa chỉ: 78 Lê Lợi, Quận 1, TP. Hồ Chí Minh

### Quyền hạn Customer:
✅ Duyệt sản phẩm  
✅ Thêm vào giỏ hàng  
✅ **Checkout đơn hàng (yêu cầu đăng nhập)**  
✅ Theo dõi đơn hàng  
✅ Tích điểm thành viên  
✅ Sử dụng voucher giảm giá  
✅ Đánh giá sản phẩm  
✅ Đăng ký nhận thông báo khuyến mãi  

### Tính năng đặc biệt:
⚠️ **Chỉ khách hàng đã đăng nhập mới được phép thanh toán (checkout)**

---

## 🎟️ Voucher Codes Hoạt Động

```
GIAM10    → Giảm 10%
GIAM50K   → Giảm 50,000₫
FREESHIP  → Miễn phí vận chuyển (30,000₫)
```

---

## 🏪 Hệ Thống Chi Nhánh

**TP. Hồ Chí Minh:** 5 chi nhánh  
**Hà Nội:** 3 chi nhánh  
**Tổng cộng:** 8 cửa hàng

---

## 📦 Dữ Liệu Sản Phẩm

- **50 sản phẩm** đồ chơi thực tế
- **17 danh mục** (LEGO, búp bê, xe điều khiển, v.v.)
- **20 thương hiệu** nổi tiếng (LEGO, Hasbro, Mattel, etc.)
- **Pagination:** 20 sản phẩm/trang

---

## 🔗 Các Trang Quan Trọng

| Trang | URL | Quyền truy cập |
|-------|-----|----------------|
| Trang chủ | `/` | Tất cả |
| Đăng nhập khách | `/login` | Guest |
| Admin Login | `/admin/login` | Admin/Staff |
| Admin Dashboard | `/admin/dashboard` | Admin only |
| Staff Dashboard | `/staff/dashboard` | Staff only |
| Sản phẩm | `/products` | Tất cả |
| Giỏ hàng | `/cart` | Tất cả |
| Checkout | `/checkout` | **Khách đã login** |
| Tìm cửa hàng | `/stores` | Tất cả |

---

## ⚡ Quick Start

### Test flow khách hàng mua hàng:
1. Truy cập `/login`
2. Đăng nhập: `customer@kinderland.vn` / `customer123`
3. Duyệt sản phẩm và thêm vào giỏ
4. Áp dụng voucher `GIAM10`
5. Checkout và hoàn tất đơn hàng

### Test flow nhân viên:
1. Truy cập `/admin/login`
2. Đăng nhập: `staff1@kinderland.vn` / `staff123`
3. Kiểm tra kho, quét QR, báo cáo hàng lỗi

### Test flow admin:
1. Truy cập `/admin/login`
2. Đăng nhập: `admin@kinderland.vn` / `admin123`
3. Quản lý sản phẩm, đơn hàng, xem báo cáo

---

## 📝 Notes

- Tất cả dữ liệu đều là **mock data** cho mục đích demo
- Hệ thống sử dụng **localStorage** để lưu trạng thái đăng nhập
- **Không cần database** - hoạt động hoàn toàn trên frontend
- Khách hàng có thể đăng nhập với **bất kỳ email/password** nào (fallback mode), nhưng khuyến nghị dùng tài khoản demo để test đầy đủ tính năng

---

## 🎯 Use Cases Implemented

✅ **38 use cases** đã hoàn thành cho 4 actors:
- Guest (Khách vãng lai)
- Customer (Khách hàng đã đăng ký)
- Administrator (Quản trị viên)
- Store Staff (Nhân viên cửa hàng)

---

**© 2026 Kinderland - Vương quốc đồ chơi trẻ em**
