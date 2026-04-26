```
backend/
├── app/
│   ├── main.py                 # File khởi chạy server FastAPI (Entry point)
│   ├── api/                    # Chứa các API endpoints (Router)
│   │   ├── routes/
│   │   │   ├── students.py     # API CRUD thông tin sinh viên
│   │   │   ├── attendance.py   # API ghi nhận và truy xuất lịch sử điểm danh
│   │   │   └── ai_proxy.py     # API trung gian gọi sang AI Server
│   ├── core/                   # Cấu hình cốt lõi
│   │   ├── config.py           # Đọc biến môi trường (Database URL, Secret keys)
│   │   └── security.py         # Logic JWT, xác thực (Authentication)
│   ├── models/                 # Chứa các model SQLAlchemy (Database schemas)
│   │   ├── student.py
│   │   └── attendance_log.py
│   ├── schemas/                # Chứa Pydantic models (Validate data request/response)
│   │   ├── student_schema.py
│   │   └── ...
│   └── services/               # Logic nghiệp vụ (Business logic)
│       └── attendance_svc.py   # Xử lý tính toán vắng/trễ, thống kê
├── alembic/                    # (Tùy chọn) Thư mục quản lý migration database
├── tests/                      # Thư mục chứa Unit test
├── requirements.txt
└── .env
```