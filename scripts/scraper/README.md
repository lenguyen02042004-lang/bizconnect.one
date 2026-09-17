# BizConnect Scraper Scripts

Thư mục này chứa các scripts để cào dữ liệu (crawl) các doanh nghiệp từ các nguồn trên internet, sau đó tự động lưu vào database Supabase của BizConnect.

## 📂 Cấu trúc thư mục
- **`utils.mjs`**: Chứa các hàm tiện ích dùng chung bắt buộc phải sử dụng khi viết scraper mới (ví dụ: khởi tạo Supabase, lấy country code, slugify, khởi tạo tài khoản system, tạo/kiểm tra ngành nghề).
- **`vietnamplas_scraper.mjs`**: Script cào dữ liệu từ triển lãm VietnamPlas.
- **`vietnamprintpack_scraper.mjs`**: Script cào dữ liệu từ triển lãm VietnamPrintPack.
- **`test_*.mjs`**: Các script dùng để test logic crawl.

## 🚀 Hướng dẫn viết Scraper mới (Dành cho AI & Developer)

> **QUAN TRỌNG:** Để đảm bảo tính nhất quán và dễ bảo trì, mọi scraper mới **phải** tuân thủ các quy tắc sau:

1. **KHÔNG viết lại các hàm tiện ích:** Mọi scraper phải import `supabase`, `setupSystemAccount`, `setupIndustry`, `getCountryCode`, v.v. từ file `utils.mjs`.
2. **Sử dụng System Account:** Khi lưu vào database (`businesses`), trường `owner_id` phải được gán bằng ID của system account. Hãy gọi `await setupSystemAccount()` ở đầu script.
3. **Phân loại Ngành nghề (Industry):** Sử dụng `await setupIndustry("Tên ngành")` để đảm bảo ngành nghề tồn tại trong bảng `industries` trước khi lưu vào DB.
4. **Cơ chế Upsert:** Luôn dùng `upsert` với cờ `onConflict: "slug"` để tránh duplicate dữ liệu khi script bị chạy lại nhiều lần.
5. **Chạy script:** 
   ```bash
   node scripts/scraper/your_new_scraper.mjs
   ```

## 🔐 Yêu cầu Môi trường (.env)
Các script này yêu cầu file `.env` ở thư mục gốc của dự án (BizConnect.One) phải chứa:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Bắt buộc dùng Service Role Key để bypass RLS khi insert từ backend script).
