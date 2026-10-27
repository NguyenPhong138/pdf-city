# Thành phố PDF

Ứng dụng xử lý PDF chạy hoàn toàn trong trình duyệt, dùng được khi không có mạng (PWA). Gồm 5 tòa nhà, mỗi tòa một chức năng:

| Tòa nhà | Chức năng |
|---|---|
| Xưởng Cắt | Tách PDF theo từng trang, cứ N trang một tệp, hoặc theo khoảng tự đặt |
| Ga Liên Kết | Gộp nhiều PDF, sắp xếp thứ tự, chọn trang lấy từ mỗi tệp |
| Thư Viện Chữ | OCR (Tesseract) rồi phủ lớp chữ vô hình. Có sẵn tiếng Việt + tiếng Anh để dùng offline |
| Studio Điểm Ảnh | Raster hóa trang theo DPI và độ sâu màu (24-bit / 8-bit xám / 1-bit) |
| Kho Lưu Trữ | Chuyển sang PDF/A-1b, 2b, 3b, có phiếu kiểm định |

Tệp PDF không bao giờ rời khỏi máy người dùng.

## Cấu trúc

```
app/            ← thư mục được xuất bản (đưa lên GitHub Pages)
  index.html    ← toàn bộ giao diện và logic
  sw.js         ← service worker, SINH TỰ ĐỘNG bởi tools/build.mjs, đừng sửa tay
  manifest.webmanifest, icons/
  vendor/       ← thư viện chép từ node_modules (pdf-lib, pdf.js, tesseract, jszip, phông chữ)
tools/
  vendor.mjs    ← chép thư viện từ node_modules vào app/vendor
  build.mjs     ← băm mọi file trong app/, ghi app/sw.js với số phiên bản mới
  sw.template.js← mẫu của service worker
  serve.mjs     ← máy chủ tĩnh cục bộ http://localhost:8080
  make-icons.mjs← vẽ icon
Mo-ThanhPhoPDF.bat ← bấm đúp để chạy trên máy này
```

## Lệnh

```powershell
npm install --ignore-scripts   # lần đầu, hoặc khi đổi phiên bản thư viện trong package.json
npm run vendor                 # chép thư viện vào app/vendor
npm run build                  # BẮT BUỘC sau mỗi lần sửa app/ — tạo phiên bản mới cho sw.js
npm run serve                  # chạy thử tại http://localhost:8080
```

## Cập nhật hoạt động thế nào

1. Sửa file trong `app/`, chạy `npm run build`, rồi xuất bản lại thư mục `app/`.
2. Lần tới người dùng mở app khi có mạng (hoặc khi app đang mở mà có mạng trở lại, tối đa 30 phút một lần), service worker so mã băm từng file và **chỉ tải những file đã đổi**.
3. Tải xong, app hiện thanh "Có bản mới". Người dùng bấm *Cập nhật ngay* để tải lại, hoặc *Để sau*.

Không có mạng thì app vẫn chạy bản đã lưu.

Nếu quên `npm run build`, `sw.js` không đổi nên trình duyệt sẽ không biết có bản mới.
