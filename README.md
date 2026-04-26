# 🎓 Attendance System with Face Recognition

> Hệ thống điểm danh tự động sử dụng nhận diện khuôn mặt trong lớp học.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-336791?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [API Endpoints](#api-endpoints)
- [Đội ngũ phát triển](#đội-ngũ-phát-triển)

---

## Tổng quan

Dự án xây dựng hệ thống điểm danh tự động cho lớp học thông qua camera, sử dụng AI nhận diện khuôn mặt để xác định danh tính sinh viên theo thời gian thực.

**Luồng hoạt động chính:**
1. Camera thu hình ảnh lớp học
2. AI phát hiện & nhận diện khuôn mặt (Face Detection → Embedding → Cosine Similarity)
3. Kết quả điểm danh hiển thị real-time trên Web App
4. Dữ liệu được lưu trữ và xuất báo cáo

**Phân chia nhóm:**
| Nhóm | Phạm vi | Công nghệ |
|---|---|---|
| **AI Team** | Model training, inference pipeline | InsightFace, PyTorch |
| **Web App Team** | Frontend UI, Backend API | React/Next.js, FastAPI |

---

## Kiến trúc hệ thống

```
┌─────────────┐    WebSocket    ┌──────────────────┐
│  Frontend   │ ◄────────────── │   Backend API    │
│  React/Next │ ──REST API────► │   FastAPI        │
└─────────────┘                 └────────┬─────────┘
      │                                  │ HTTP
      │ Camera                           ▼
      │ Stream              ┌──────────────────────┐
      │                     │    AI Server         │
      │                     │  InsightFace Pipeline│
      │                     │  (Face Det + Embed)  │
      │                     └──────────┬───────────┘
      │                                │
      │                     ┌──────────▼───────────┐
      │                     │  PostgreSQL + pgvector│
      └─────────────────────│  (Embeddings + Logs) │
                            └──────────────────────┘
```

---

## Cấu trúc thư mục

```
Attendance-system-with-face/
├── ai/                          # AI Server (FastAPI + InsightFace)
│   ├── main.py                  # Entry point FastAPI
│   ├── pipeline/                # AI pipeline modules
│   │   ├── detector.py          # Face detection
│   │   ├── embedder.py          # Face embedding
│   │   └── matcher.py           # Cosine similarity matching
│   ├── db/                      # Database models & queries
│   ├── requirements.txt
│   └── Dockerfile
├── backend/                     # Backend API (quản lý nghiệp vụ)
│   └── ...                      # TODO: Thêm sau
├── frontend/                    # Web App (React/Next.js)
│   └── ...                      # TODO: Thêm sau
├── docker-compose.yml
└── README.md
```

---

## Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu |
|---|---|
| Docker | 24.x+ |
| Docker Compose | 2.x+ |
| RAM | 4GB+ (khuyến nghị 8GB) |
| GPU | NVIDIA GPU (tùy chọn, tăng tốc inference) |
| Camera | Webcam USB hoặc IP Camera |

---

## Cài đặt & Chạy

### 1. Clone repository

```bash
git clone <repo-url>
cd Attendance-system-with-face
```

### 2. Tạo file môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env theo cấu hình của bạn
```

### 3. Chạy với Docker Compose

```bash
# Lần đầu (build image)
docker compose up --build

# Các lần sau
docker compose up

# Chạy nền (không cần terminal)
docker compose up -d

# Dừng hệ thống
docker compose down
```

### 4. Kiểm tra hoạt động

- AI Server API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- Database: localhost:5432

---

## Cấu hình môi trường

Tạo file `.env` tại thư mục gốc:

```env
# Database
POSTGRES_USER=attendance_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=attendance_db

# AI Configuration
SIMILARITY_THRESHOLD=0.45        # Ngưỡng nhận diện (0.0 - 1.0)
                                 # Cao hơn = chặt hơn, ít false positive

# (Sẽ bổ sung thêm)
# SECRET_KEY=your_secret_key
# CORS_ORIGINS=http://localhost:3000
```

**Điều chỉnh SIMILARITY_THRESHOLD:**
| Giá trị | Hành vi |
|---|---|
| `0.5` | Nghiêm ngặt — ít sai, nhưng có thể bỏ sót |
| `0.45` | Cân bằng — **khuyến nghị mặc định** |
| `0.4` | Dễ tính — nhiều nhận diện hơn, có thể sai |

---

## API Endpoints

### AI Server (port 8000)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/recognize` | Nhận diện khuôn mặt từ ảnh |
| `POST` | `/register` | Đăng ký khuôn mặt mới |
| `GET` | `/students` | Danh sách sinh viên đã đăng ký |
| `DELETE` | `/students/{id}` | Xóa sinh viên |

> 📌 Chi tiết API xem tại: http://localhost:8000/docs

---

## Đội ngũ phát triển

| Thành viên | Vai trò |
|---|---|
| [AI Team] | Model training, AI inference pipeline |
| [Web Team] | Frontend React, Backend API, Database |

---

## 📝 Ghi chú

- Dự án đang trong giai đoạn phát triển (học thuật)
- Dữ liệu khuôn mặt do nhóm tự thu thập (thay thế nguồn từ trường)
- Model mặc định: **InsightFace buffalo_l** (tự động tải về lần đầu)

---

*Last updated: 26/04/2026*