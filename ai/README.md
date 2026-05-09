# 👁️ AI Facial Recognition Attendance Layer (FastAPI)

Chào mừng bạn đến với module lõi (AI Service) của hệ thống điểm danh tự động bằng khuôn mặt.
Đây là một **Microservice** độc lập được viết bằng **FastAPI**, chịu trách nhiệm hoàn toàn về các logic liên quan đến dữ liệu sinh trắc học, thuật toán nhận diện khuôn mặt và quản lý các phiên điểm danh theo thời gian thực.

## 🚀 Tính năng cốt lõi (Features)

1. **Quản lý danh tính (Human Management)**: Thêm sinh viên vào hệ thống, tự động extract đặc trưng khuôn mặt (Embedding 512 chiều) lưu trữ bằng `pgvector`.
2. **Quản lý Lớp học (Task Management)**: Khởi tạo danh sách lớp, gắn kết sinh viên vào lớp học.
3. **Quản lý Phiên điểm danh (Session Workflow)**:
   - Mở ca học/buổi làm việc (`ACTIVE`).
   - Clone danh sách sinh viên tự động từ `Task` sang `Session` với trạng thái vắng mặt.
   - Đóng ca (`CLOSED`).
4. **Nhận dạng Thời gian thực (Real-time Recognition)**:
   - Nhận diện khuôn mặt với độ trễ cực thấp.
   - Tính toán khoảng cách Similarity (Cosine) để đối soát với CSDL trong tích tắc.
   - Hỗ trợ tuỳ chọn: Vẽ Bounding Box (khung mặt) & Trích xuất ảnh (Crop faces).
5. **Thống kê Báo cáo (Report)**: Đếm số lượng, tỷ lệ điểm danh, ghi nhận giờ bắt đầu/kết thúc (Chống gian lận).
6. **Live Dashboard (WebSocket)**: Bắn event realtime (Push Notification) mỗi khi nhận dạng thành công một người hoặc phát hiện người lạ, không cần F5 tải lại trang.

## 🧠 Kiến trúc Model AI

Dự án sử dụng bộ mô hình của **InsightFace** (cụ thể là mô hình `buffalo_l`).

- **Detection**: Nhận diện vị trí khuôn mặt (Bounding box).
- **Recognition**: Chuyển đổi khuôn mặt từ hình ảnh (Ma trận Pixel) thành một Vector không gian 512 chiều (Embedding).
- **Khoảng cách Cosine**: Để đánh giá mức độ tương đồng giữa khuôn mặt thu từ Camera và khuôn mặt trong Database (`1.0` = Hoàn toàn giống nhau).

> [!WARNING]
> **Known Limitations (Vấn đề đã biết)**: Mô hình hiện tại không có Liveness Detection (Anti-spoofing). Hệ thống có thể nhận nhầm một bức tranh vẽ hoặc ảnh chụp trên điện thoại là người thật nếu góc chụp quá sắc nét. Giải pháp tạm thời là dựa vào `detection_count` (số lần xuất hiện trong Log) để loại trừ.

## ⚙️ Hướng dẫn Cài đặt & Chạy (Setup)

### 1. Chạy qua Docker (Khuyến nghị)

Hệ thống AI này được thiết kế để chạy song song cùng Database PostgreSQL (có cài sẵn extension `pgvector`) thông qua Docker Compose.

```bash
# Đứng tại thư mục root (Attendance-system-with-face)
docker compose up
```

### 2. Chạy môi trường Dev Local

```bash
cd ai
uvicorn main:app --reload
```

- **Tài liệu API (Swagger UI):** Khám phá tất cả các Endpoint tại `http://127.0.0.1:8000/docs`.

## 🔄 Workflow Sử Dụng (Dành cho System / Frontend)

1. **Chuẩn bị (Phase 1):**
   - Backend gọi API tạo Lớp (`POST /task`) & Đăng ký người (`POST /human`).
   - Thêm Người vào Lớp (`POST /task/{task_id}/humans`).
2. **Khởi động điểm danh (Phase 2):**
   - Tạo buổi học mới: `POST /task/{task_id}/session`. Endpoint sẽ tự động setup sổ điểm danh và trả về `session_id`.
3. **Livestream điểm danh (Phase 3):**
   - Camera IoT hoặc Backend phụ liên tục gửi khung hình tới: `POST /session/{session_id}/recognize`.
   - Kết nối trình duyệt của Giáo viên vào WebSockets: `WS /ws/session/{session_id}` để thấy thông báo nảy lên ngay khi có người bước vào.
4. **Kết thúc & Đánh giá (Phase 4 & 5):**
   - Đóng phiên: `PUT /session/{session_id}/close`.
   - Xem thống kê buổi học: `GET /session/{session_id}/report`.

## 📁 Cấu trúc thư mục

```text
ai/
├── ai_service/         # Lõi thuật toán (InsightFace, OpenCV xử lý ảnh, Cosine Similarity)
├── alembic/            # Database Migrations (Tự động sync DB Models lên Postgres)
├── db/                 # Cấu hình kết nối DB (Async SQLAlchemy)
├── routers/
│   ├── human/          # API Quản lý thông tin & Ảnh sinh viên
│   ├── task/           # API Lớp học
│   ├── session/        # API Cốt lõi: Điểm danh, Websocket, Reporting
│   └── user/           # Quản lý tài khoản Admin/Tổ chức (FastAPI-Users)
├── main.py             # File khởi chạy FastAPI
└── requirements.txt    # Danh sách thư viện Python cần thiết
```
