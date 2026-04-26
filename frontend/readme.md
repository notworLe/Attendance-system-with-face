```
frontend/
├── src/
│   ├── app/                    # Chứa các Page (Routing)
│   │   ├── (auth)/             # Nhóm route đăng nhập/đăng ký
│   │   │   └── login/page.tsx
│   │   ├── dashboard/          # Trang tổng quan cho giảng viên
│   │   │   └── page.tsx
│   │   ├── students/           # Trang quản lý danh sách sinh viên
│   │   │   └── page.tsx
│   │   ├── globals.css         # Style chung toàn cục
│   │   └── layout.tsx          # Layout tổng (Sidebar, Header)
│   ├── components/             # React Components tái sử dụng
│   │   ├── ui/                 # Các component cơ bản (Button, Modal, Table)
│   │   └── features/           # Component nghiệp vụ (CameraView, AttendanceChart)
│   ├── lib/                    # Các hàm tiện ích (Utility functions)
│   │   ├── api.ts              # Cấu hình Axios/Fetch gọi về Backend
│   │   └── utils.ts            # Hàm format ngày tháng, chuỗi...
│   ├── hooks/                  # Custom React Hooks
│   │   └── useCamera.ts        # Hook xử lý logic bật/tắt luồng camera
│   └── types/                  # Chứa các interface/type định nghĩa kiểu dữ liệu (TypeScript)
├── public/                     # Chứa hình ảnh tĩnh, icon
├── package.json
├── next.config.mjs
└── tsconfig.json
```