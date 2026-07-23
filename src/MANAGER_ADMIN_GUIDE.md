# Hướng dẫn sử dụng hệ thống Manager & Administrator - Kinderland

## Tổng quan
Website Kinderland hiện có 3 cấp độ quản trị:
- **Administrator** - Toàn quyền quản trị hệ thống
- **Manager** - Quản lý cửa hàng và hoạt động kinh doanh
- **Staff** - Nhân viên cửa hàng

---

## Tài khoản Demo

### 1. Administrator (Toàn quyền)
- **Email**: admin@kinderland.vn
- **Password**: admin123
- **Dashboard**: `/admin/dashboard`

### 2. Manager (Quản lý)
- **Email**: manager@kinderland.vn
- **Password**: manager123
- **Dashboard**: `/manager/dashboard`

### 3. Staff (Nhân viên)
- **Email**: staff1@kinderland.vn hoặc staff2@kinderland.vn
- **Password**: staff123
- **Dashboard**: `/staff/dashboard`

---

## I. ADMINISTRATOR - Quản trị viên

Administrator có toàn quyền quản lý mọi chức năng của hệ thống.

### A. Quản lý Sản phẩm & Danh mục

#### 1. Quản lý Sản phẩm (UC-18, UC-45, UC-46, UC-47)
**Đường dẫn**: `/admin/products`

**Chức năng**:
- ✅ Xem danh sách tất cả sản phẩm
- ✅ Thêm sản phẩm mới
- ✅ Chỉnh sửa thông tin sản phẩm
- ✅ Xóa sản phẩm
- ✅ Quản lý giá, tồn kho, hình ảnh
- ✅ Phân loại theo danh mục, thương hiệu, độ tuổi

**Business Rules**:
- BR-40: SKU phải là duy nhất
- BR-41: Sản phẩm có đơn hàng không thể xóa
- BR-42: Chỉ Admin mới có thể thay đổi giá gốc

#### 2. Quản lý Danh mục (UC-19)
**Đường dẫn**: `/admin/categories`

**Chức năng**:
- ✅ Tạo danh mục mới
- ✅ Chỉnh sửa tên và mô tả danh mục
- ✅ Sắp xếp thứ tự hiển thị
- ✅ Quản lý cấu trúc phân cấp (Parent-Child)

**Business Rules**:
- BR-43: Tên danh mục phải unique trong cùng cấp
- BR-44: Danh mục có sản phẩm không thể xóa
- BR-45: Hỗ trợ tối đa 3 cấp phân cấp

### B. Quản lý Đơn hàng

#### 3. Quản lý Đơn hàng (UC-20)
**Đường dẫn**: `/admin/orders`

**Chức năng**:
- ✅ Xem tất cả đơn hàng
- ✅ Cập nhật trạng thái (Processing, Shipped, Delivered, Cancelled)
- ✅ Xác nhận thanh toán
- ✅ Gán mã vận chuyển
- ✅ Xem lịch sử đơn hàng

**Business Rules**:
- BR-46: Đơn "Delivered" hoặc "Cancelled" không thể sửa
- BR-47: Hủy đơn sẽ hoàn lại tồn kho tự động
- BR-48: Điểm loyalty chỉ cộng khi đơn "Delivered"

#### 4. Xử lý Hoàn trả (UC-24)
**Đường dẫn**: `/admin/returns`

**Chức năng**:
- ✅ Duyệt yêu cầu trả hàng
- ✅ Kiểm tra tình trạng sản phẩm
- ✅ Xử lý hoàn tiền hoặc đổi hàng
- ✅ Cập nhật tồn kho sau khi nhận hàng

**Business Rules**:
- BR-31: Chỉ nhận trả trong vòng 7 ngày
- BR-32: Phải kiểm tra hàng trước khi hoàn tiền
- BR-33: Miễn phí vận chuyển nếu lỗi từ shop

### C. Marketing & Khuyến mãi

#### 5. Quản lý Khuyến mãi (UC-21)
**Đường dẫn**: `/admin/promotions`

**Chức năng**:
- ✅ Tạo mã giảm giá (Voucher codes)
- ✅ Thiết lập Flash Sale
- ✅ Cấu hình giảm giá theo %  hoặc số tiền cố định
- ✅ Giới hạn số lần sử dụng
- ✅ Đặt điều kiện tối thiểu (Minimum spend)
- ✅ Chọn phạm vi áp dụng (toàn bộ/danh mục/sản phẩm cụ thể)

**Business Rules**:
- BR-49: Chỉ áp dụng 1 mã giảm giá/đơn hàng
- BR-50: Flash Sale tự động kết thúc đúng giờ
- BR-51: Giảm giá tối đa 50% trừ khi Super Admin cho phép
- BR-52: Điểm loyalty tính theo giá sau giảm
- BR-53: Không áp dụng voucher cho hàng Clearance (đã giảm >70%)

#### 6. Quản lý Blog (UC-25)
**Đường dẫn**: `/admin/blog`

**Chức năng**:
- ✅ Tạo bài viết mới
- ✅ Chỉnh sửa nội dung
- ✅ Upload hình ảnh, video
- ✅ Phân loại bài viết
- ✅ Lên lịch đăng bài
- ✅ Quản lý banner quảng cáo

**Business Rules**:
- BR-66: Tiêu đề bài viết phải unique
- BR-67: Chỉ pin tối đa 10 bài lên homepage

#### 7. Quản lý Chính sách (UC-48)
**Đường dẫn**: `/admin/policies`

**Chức năng**:
- ✅ Cập nhật chính sách đổi trả
- ✅ Chính sách bảo mật
- ✅ Điều khoản sử dụng
- ✅ Chính sách vận chuyển

#### 8. Quản lý Đánh giá (UC-31)
**Đường dẫn**: `/admin/reviews`

**Chức năng**:
- ✅ Duyệt đánh giá của khách hàng
- ✅ Phản hồi đánh giá
- ✅ Ẩn/xóa đánh giá vi phạm
- ✅ Tự động cộng điểm cho khách viết review

**Business Rules**:
- BR-82: Mỗi khách chỉ review 1 lần/sản phẩm
- BR-83: Tối thiểu 10 ký tự
- BR-84: Hình ảnh vi phạm sẽ đưa vào hàng chờ ưu tiên
- BR-85: Thưởng 50 điểm cho text review, 100 điểm nếu có ảnh

### D. Quản lý Người dùng & Phân quyền

#### 9. Quản lý Người dùng (UC-22)
**Đường dẫn**: `/admin/users`

**Chức năng**:
- ✅ Xem danh sách tất cả khách hàng
- ✅ Tạo/sửa/khóa tài khoản
- ✅ Điều chỉnh điểm loyalty thủ công
- ✅ Reset mật khẩu
- ✅ Quản lý tài khoản nhân viên

**Business Rules**:
- BR-54: Chỉ Admin mới tạo/xóa tài khoản Staff/Manager
- BR-55: Cộng điểm thủ công >500 cần phê duyệt cấp 2
- BR-56: Manager/Admin phải bật MFA
- BR-57: Mật khẩu tối thiểu 8 ký tự, có số và chữ hoa

#### 10. Quản lý Phân quyền (UC-43)
**Đường dẫn**: `/admin/permissions`

**Chức năng**:
- ✅ Xem danh sách roles (Admin, Manager, Customer)
- ✅ Thiết lập quyền cho từng role
- ✅ Quản lý module truy cập

#### 11. Thêm Quyền cho Role (UC-44)
**Đường dẫn**: `/admin/role-permissions`

**Chức năng**:
- ✅ Gán quyền cụ thể cho vai trò
- ✅ Nhóm quyền theo module

**Business Rules**:
- Role không thể có quyền trùng lặp
- Thay đổi quyền có hiệu lực ngay lập tức

### E. Báo cáo & Tài chính

#### 12. Dashboard Tổng quan (UC-42)
**Đường dẫn**: `/admin/overview`

**Chức năng**:
- ✅ Xem tổng quan doanh số
- ✅ Thống kê người dùng truy cập
- ✅ Đơn hàng theo thời gian
- ✅ Biểu đồ trực quan

**Business Rules**:
- BR-02: Dữ liệu dashboard cập nhật real-time
- BR-03: Chỉ tính doanh thu từ đơn đã thanh toán

#### 13. Báo cáo Chi tiết (UC-23)
**Đường dẫn**: `/admin/reports`

**Chức năng**:
- ✅ Báo cáo doanh số theo sản phẩm
- ✅ Báo cáo theo danh mục
- ✅ Báo cáo tồn kho
- ✅ Báo cáo khách hàng
- ✅ Export Excel/PDF

**Business Rules**:
- BR-58: Phân biệt Gross Revenue và Net Revenue
- BR-59: Chỉ Admin xem được Profit Margin
- BR-60: Highlight hàng tồn kho >180 ngày
- BR-61: Ẩn một phần thông tin cá nhân (j***@email.com)

#### 14. Quản lý Tài chính (UC-26)
**Đường dẫn**: `/admin/financial`

**Chức năng**:
- ✅ Theo dõi doanh thu, chi phí
- ✅ Báo cáo lợi nhuận
- ✅ Export dữ liệu cho kế toán

**Business Rules**:
- BR-01: Chỉ Manager/Admin mới truy cập
- BR-02: Doanh thu tính từ đơn đã xác nhận và thanh toán
- BR-03: Dữ liệu tài chính được mã hóa
- BR-04: Log mọi thay đổi để audit

### F. Cài đặt Tài khoản

#### 15. Đổi Mật khẩu (UC-39)
**Đường dẫn**: `/admin/change-password`

**Chức năng**:
- ✅ Đổi mật khẩu cá nhân
- ✅ Xác thực mật khẩu cũ
- ✅ Gửi email thông báo sau khi đổi

**Business Rules**:
- BR-01: Mật khẩu mới phải đạt chuẩn bảo mật
- BR-02: Không được trùng mật khẩu cũ
- BR-03: Lưu mật khẩu đã mã hóa
- BR-04: Log hoạt động đổi mật khẩu

#### 16. Cài đặt Hệ thống
**Đường dẫn**: `/admin/settings`

**Chức năng**:
- ✅ Cấu hình website
- ✅ Cài đặt email, SMS
- ✅ Tích hợp thanh toán
- ✅ Cài đặt vận chuyển

---

## II. MANAGER - Quản lý

Manager có quyền quản lý sản phẩm, đơn hàng, kho hàng, marketing và báo cáo.

### A. Quản lý Sản phẩm (Tương tự Admin)

#### 1. Quản lý Sản phẩm (UC-18, UC-45, UC-46, UC-47)
**Đường dẫn**: `/manager/products`
- Tương tự Admin nhưng **KHÔNG thể** thay đổi giá gốc (base price)

#### 2. Quản lý Danh mục (UC-19)
**Đường dẫn**: `/manager/categories`
- Tương tự Admin

#### 3. Kiểm tra Tồn kho (UC-27)
**Đường dẫn**: `/manager/inventory`

**Chức năng**:
- ✅ Xem tồn kho theo chi nhánh
- ✅ Tìm kiếm theo SKU, tên sản phẩm
- ✅ Cảnh báo hàng sắp hết
- ✅ Xem vị trí kệ hàng (shelf/aisle)

**Business Rules**:
- BR-70: Tồn kho cập nhật real-time sau mỗi giao dịch
- BR-71: Ngưỡng Safety Stock khác nhau theo category
- BR-72: Chỉ Manager/Admin xem được giá vốn
- BR-73: Hàng "Reserved" (đang chờ lấy) không tính vào "Available to Sell"

#### 4. Cập nhật Kho (UC-35)
**Đường dẫn**: `/manager/storage`

**Chức năng**:
- ✅ Cập nhật số lượng tồn kho
- ✅ Nhập thêm hàng vào kho
- ✅ Xem lịch sử cập nhật

**Business Rules**:
- BR-35-01: Số lượng không được âm
- BR-35-02: Chỉ Manager mới cập nhật được
- BR-35-03: Log tất cả thay đổi
- BR-35-04: Cảnh báo nếu vượt sức chứa kho

### B. Quản lý Đơn hàng & Bán hàng

#### 5. Quản lý Đơn hàng (UC-20)
**Đường dẫn**: `/manager/orders`
- Tương tự Admin

#### 6. Tạo Đơn hàng (UC-36, UC-37)
**Đường dẫn**: `/manager/create-order`

**Chức năng**:
- ✅ Tạo đơn hàng cho khách tại cửa hàng
- ✅ Nhập thông tin khách hàng
- ✅ Chọn sản phẩm và số lượng
- ✅ Áp dụng mã giảm giá
- ✅ Chọn hình thức thanh toán

**Business Rules**:
- BR-01: Phải có địa chỉ giao hàng hợp lệ
- BR-02: Giảm tồn kho ngay sau khi tạo đơn
- BR-03: Mỗi đơn có Order ID duy nhất
- BR-04: Đơn thanh toán online phải "Paid" mới confirm

#### 7. Xử lý Hoàn trả (UC-24, UC-52)
**Đường dẫn**: `/manager/returns`
- Tương tự Admin

### C. Kho hàng & Vận chuyển

#### 8. Yêu cầu Chuyển kho (UC-49)
**Đường dẫn**: `/manager/stock-transfer`

**Chức năng**:
- ✅ Tạo yêu cầu chuyển hàng giữa các chi nhánh
- ✅ Chọn chi nhánh nguồn và đích
- ✅ Chọn sản phẩm và số lượng
- ✅ Theo dõi trạng thái chuyển kho

**Business Rules**:
- BR-01: Số lượng chuyển không vượt quá tồn kho nguồn
- BR-02: Nguồn và đích phải khác nhau
- BR-03: Hàng chỉ trừ kho sau khi approve
- BR-04: Log tất cả yêu cầu với timestamp và Manager ID

#### 9. Nhập hàng từ Kho chính (UC-50)
**Đường dẫn**: `/manager/import-orders`

**Chức năng**:
- ✅ Tạo đơn nhập hàng từ nhà cung cấp
- ✅ Chọn nhà cung cấp
- ✅ Nhập sản phẩm, số lượng, giá nhập
- ✅ Tự động tính tổng chi phí

**Business Rules**:
- BR-01: Đơn nhập phải có ít nhất 1 sản phẩm
- BR-02: Số lượng >0
- BR-03: Hệ thống tự tính tổng chi phí
- BR-04: Tồn kho chỉ cập nhật khi hàng về và confirm
- BR-05: Mỗi đơn nhập có Import Order ID unique

#### 10. Quản lý Nhập hàng (UC-51)
**Đường dẫn**: `/manager/import-management`

**Chức năng**:
- ✅ Xem danh sách đơn nhập
- ✅ Cập nhật trạng thái (Draft, Pending, Approved, Shipped, Received, Cancelled)
- ✅ Xác nhận nhận hàng
- ✅ Cập nhật tồn kho sau khi nhận

**Business Rules**:
- BR-01: Chỉ Manager/Admin quản lý được
- BR-02: Phải có nhà cung cấp và ít nhất 1 sản phẩm
- BR-03: Tồn kho chỉ tăng khi status = "Received"
- BR-04: Đơn Completed/Cancelled không sửa được
- BR-05: Log mọi cập nhật với timestamp và Manager ID

#### 11. Báo cáo Hàng lỗi (UC-33)
**Đường dẫn**: `/manager/defective-report`

**Chức năng**:
- ✅ Liệt kê hàng lỗi, hỏng
- ✅ Scan barcode hoặc nhập SKU
- ✅ Chọn lý do (Damaged in Transit, Expired, Broken)
- ✅ Upload ảnh bằng chứng
- ✅ Gửi yêu cầu thanh lý

**Business Rules**:
- BR-110: Giá trị >$200 cần phê duyệt Regional Manager
- BR-111: Hàng hết hạn phải thanh lý ngay vì lý do an toàn
- BR-112: Lý do "Damaged in Transit" tự động tạo claim với đơn vị vận chuyển

#### 12. Kiểm kê Thực tế (UC-34)
**Đường dẫn**: `/manager/physical-count`

**Chức năng**:
- ✅ Đếm số lượng thực tế trên kệ
- ✅ Scan vị trí kệ (Bin ID)
- ✅ Scan sản phẩm
- ✅ Nhập số lượng đếm được
- ✅ Hệ thống so sánh với số liệu hệ thống

**Business Rules**:
- BR-120: Blind Count - không hiển thị số liệu hệ thống khi đếm
- BR-121: Chênh lệch âm >2% cần mã override từ Area Manager
- BR-122: Khi đang kiểm kê, SKU đó bị lock không cho Ship-from-Store

### D. Marketing & Nội dung

#### 13. Quản lý Khuyến mãi (UC-21)
**Đường dẫn**: `/manager/promotions`
- Tương tự Admin

#### 14. Quản lý Blog (UC-25)
**Đường dẫn**: `/manager/blog`
- Tương tự Admin

#### 15. Quản lý Chính sách (UC-48)
**Đường dẫn**: `/manager/policies`
- Tương tự Admin

#### 16. Quản lý Đánh giá (UC-31)
**Đường dẫn**: `/manager/reviews`
- Tương tự Admin

### E. Báo cáo & Tài chính

#### 17. Báo cáo Tổng hợp (UC-23)
**Đường dẫn**: `/manager/reports`
- Xem báo cáo doanh số
- Xem hiệu suất bán hàng
- **KHÔNG** xem được Profit Margin (chỉ Admin)

#### 18. Quản lý Tài chính (UC-26)
**Đường dẫn**: `/manager/financial`
- Xem doanh thu, chi phí
- **KHÔNG** truy cập dữ liệu nhạy cảm như Profit Margin

### F. Quản lý Tài khoản

#### 19. Quản lý Người dùng (UC-22)
**Đường dẫn**: `/manager/users`
- Quản lý tài khoản khách hàng
- **KHÔNG** tạo/xóa tài khoản Staff/Manager (chỉ Admin)

#### 20. Đổi Mật khẩu (UC-39)
**Đường dẫn**: `/manager/change-password`
- Tương tự Admin

---

## So sánh Quyền hạn

| Chức năng | Admin | Manager | Staff |
|-----------|-------|---------|-------|
| Quản lý Sản phẩm | ✅ Full | ✅ Không đổi giá gốc | ❌ |
| Quản lý Danh mục | ✅ | ✅ | ❌ |
| Quản lý Đơn hàng | ✅ | ✅ | ✅ Xem only |
| Xử lý Hoàn trả | ✅ | ✅ | ✅ |
| Quản lý Khuyến mãi | ✅ | ✅ | ❌ |
| Quản lý Blog | ✅ | ✅ | ❌ |
| Quản lý Phân quyền | ✅ | ❌ | ❌ |
| Quản lý User | ✅ Full | ✅ Khách hàng only | ❌ |
| Xem Profit Margin | ✅ | ❌ | ❌ |
| Tạo/Xóa Staff | ✅ | ❌ | ❌ |
| Kiểm tra Tồn kho | ✅ | ✅ | ✅ |
| Chuyển kho | ✅ Approve | ✅ Request | ✅ Request |
| Nhập hàng | ✅ | ✅ | ❌ |
| Kiểm kê | ✅ | ✅ | ✅ |

---

## Luồng hoạt động tiêu biểu

### Luồng 1: Manager tạo đơn nhập hàng
1. Đăng nhập `/admin/login` với tài khoản Manager
2. Vào `/manager/import-orders`
3. Chọn nhà cung cấp
4. Thêm sản phẩm và số lượng
5. Hệ thống tự tính tổng chi phí
6. Submit đơn nhập
7. Chờ hàng về
8. Vào `/manager/import-management`
9. Cập nhật status = "Received"
10. Hệ thống tự động cập nhật tồn kho

### Luồng 2: Manager xử lý yêu cầu trả hàng
1. Khách gửi yêu cầu trả hàng (qua website hoặc liên hệ trực tiếp)
2. Manager vào `/manager/returns`
3. Xem chi tiết yêu cầu
4. Kiểm tra tình trạng sản phẩm
5. Quyết định: Approve/Reject
6. Nếu Approve:
   - Chọn Refund hoặc Exchange
   - Tính toán số tiền hoàn
   - Hệ thống gửi refund request đến Payment Gateway
   - Cập nhật tồn kho nếu hàng còn bán được

### Luồng 3: Admin tạo chương trình khuyến mãi Flash Sale
1. Đăng nhập với tài khoản Admin
2. Vào `/admin/promotions`
3. Chọn "Create New Promotion"
4. Chọn loại: Flash Sale
5. Cấu hình:
   - Discount: 30%
   - Scope: Specific Category (VD: LEGO)
   - Duration: 2 giờ (14:00 - 16:00)
6. Upload banner
7. Set status = "Active"
8. Save
9. Hệ thống tự động áp dụng giảm giá vào đúng 14:00
10. Tự động kết thúc đúng 16:00

---

## Lưu ý Bảo mật

1. **Mật khẩu mạnh**: Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt
2. **MFA (Multi-Factor Authentication)**: Bắt buộc cho Admin và Manager
3. **Session timeout**: Tự động đăng xuất sau 24h không hoạt động
4. **Audit Trail**: Mọi thao tác quan trọng đều được log
5. **Phân quyền rõ ràng**: Chỉ truy cập những gì cần thiết

---

## Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- **Email**: support@kinderland.vn
- **Hotline**: 1900-xxxx
- **Tài liệu kỹ thuật**: Xem file `Use Case Descriptions` để biết chi tiết về Business Rules

---

## Changelog

**Version 1.0** (20/02/2026)
- Khởi tạo hệ thống Manager và Administrator Dashboard
- Triển khai đầy đủ 52 Use Cases
- Tích hợp màu sắc mới: Red (#AF140B) + Gold (#D4AF37)
- Hỗ trợ 3 roles: Admin, Manager, Staff
