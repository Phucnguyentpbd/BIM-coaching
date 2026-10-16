# Bản đồ Tài nguyên Google Drive (G:\My Drive\my)

Tài liệu này thiết lập mối liên kết tra cứu trực tiếp giữa hệ thống thư mục cục bộ của Google Drive (`G:\My Drive\my`) với từng chương học và bài tập thực hành trong giáo trình **BIM Tuyến 2027**.

---

## 1. Danh mục tài liệu trọng tâm & Ánh xạ bài học

| STT | Tệp tin / Thư mục trên Google Drive | Dung lượng / Định dạng | Mục đích sử dụng | Chương giáo trình áp dụng |
|---|---|---|---|---|
| **1** | `G:\My Drive\my\Hoctap\20240831_Tai lieu hoc Civil Design.pdf` | 30.3 MB (PDF) | Tài liệu đào tạo thiết kế hạ tầng Civil Design toàn diện; bao gồm quy trình phối hợp Navisworks và diễn họa InfraWorks bối cảnh. | **Chương 1, 3, 4, 9, 14, 15** |
| **2** | `G:\My Drive\my\Hoctap\Hướng_Dẫn_Tổng_Hợp_Mô_Hình_BIM_GIS_Google_Gemini.pdf` | 888 KB (PDF) | Cẩm nang lý thuyết & thực hành tích hợp mô hình BIM sang hệ thống thông tin địa lý GIS; phương pháp làm sạch thuộc tính, khử nhiễu hình học. | **Chương 18, 19, 20, 21** |
| **3** | `G:\My Drive\my\Hoctap\VSI Academy - Quy Trình Kiểm soát Corridor Target trong Civil 3D.pdf` | 72.1 MB (PDF) | Quy trình chuẩn kiểm soát Corridor Target (Surface, Offset, Elevation) và tối ưu tần suất cọc (Frequency) tại đoạn cong, nút giao; xử lý triệt để lỗi quạt taluy. | **Chương 3 (Bài 3.1 - 3.4), Chương 5** |
| **4** | `G:\My Drive\my\GIS\Binh Dinh_DEM` | Thư mục Raster (GeoTIFF) | Dữ liệu mô hình số độ cao địa hình (DEM) tỉnh Bình Định, độ phân giải cao; dùng làm địa hình bối cảnh cho InfraWorks và phân tích trắc diện trong QGIS. | **Chương 14 (InfraWorks), Chương 18, 20 (QGIS)** |
| **5** | `G:\My Drive\my\GIS\Ranh hanh chinh moi 2025` | Thư mục Shapefile/GeoPackage | Lớp vector ranh giới hành chính các cấp tỉnh Bình Định cập nhật mới nhất; dùng để kiểm tra ranh thu hồi đất và giải phóng mặt bằng (GPMB). | **Chương 19, 20, 21 (Bản đồ GPMB & QGIS)** |
| **6** | `G:\My Drive\my\TIEU CHUAN\` | Thư mục PDF | Hệ thống quy chuẩn, tiêu chuẩn Việt Nam về đường bộ và hướng dẫn áp dụng BIM của Bộ Xây dựng (TCVN 5729, TCVN 4054, QCVN 41:2024, QĐ 348/QĐ-BXD). | **Xuyên suốt Chương 1 đến Chương 24** |
| **7** | `G:\My Drive\my\Hoctap\Cilvil 3d\` | Thư mục Google Docs / Files | Ghi chép kinh nghiệm thực tế về Civil 3D và Vehicle Tracking kiểm tra quỹ đạo xe chạy tại nút giao và đường cong bán kính nhỏ. | **Chương 3, Chương 10** |
| **8** | `G:\My Drive\my\lisp\` | Thư mục AutoLISP (.lsp) | Bộ lisp hỗ trợ biên tập và làm sạch bình đồ, trích xuất tọa độ tim tuyến và ranh taluy phục vụ kiểm tra chéo. | **Chương 4, Chương 19** |

---

## 2. Quy trình trích xuất và bảo toàn dữ liệu

1. **Nguyên tắc không phá vỡ nguồn gốc**: Dữ liệu trên Google Drive là kho lưu trữ tham chiếu (Reference Store). Khi làm bài tập thực hành, học viên sao chép (Copy) dữ liệu sang thư mục làm việc cục bộ của dự án (ví dụ `D:\BIM_PROJECT_2027\01_INPUT`), tuyệt đối không chỉnh sửa trực tiếp trên file gốc Google Drive.
2. **Kiểm tra phiên bản**: Các tài liệu PDF đào tạo được biên soạn cho các phiên bản trước (2024-2025). Khi áp dụng trên môi trường Autodesk 2027, cần chú ý các menu lệnh và bảng hộp thoại đã được tối ưu hóa giao diện mới.
3. **Đồng bộ hóa đám mây (Cloud Sync)**: Đảm bảo phần mềm Google Drive for Desktop hoạt động ở chế độ *Stream files* hoặc đã chọn *Available offline* cho thư mục `G:\My Drive\my\Hoctap` và `G:\My Drive\my\GIS` để tránh việc mất kết nối mạng làm gián đoạn bài thực hành.
