import './globals.css';

export const metadata = {
  title: 'FaceAttend — Hệ thống điểm danh khuôn mặt',
  description: 'Hệ thống điểm danh tự động sử dụng nhận diện khuôn mặt AI cho lớp học',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
