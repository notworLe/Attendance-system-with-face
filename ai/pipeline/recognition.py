import cv2
import os
from retinaface import RetinaFace

def process_video_to_faces(video_path, output_dir, interval_seconds=1.0):
    """
    Trích xuất khuôn mặt từ video dựa trên khoảng thời gian (interval).
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"status": "error", "message": "Cannot open video file"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    hop_frames = int(fps * interval_seconds)
    
    frame_count = 0
    saved_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Chỉ xử lý tại các frame theo interval_seconds
        if frame_count % hop_frames == 0:
            # Nhận diện khuôn mặt (Đề tài số 9)
            try:
                faces = RetinaFace.detect_faces(frame)
                
                if isinstance(faces, dict):
                    for key, face in faces.items():
                        area = face['facial_area']
                        # Cắt ảnh khuôn mặt theo tọa độ
                        face_img = frame[area[1]:area[3], area[0]:area[2]]
                        
                        if face_img.size > 0:
                            file_name = f"task_face_{saved_count}_{frame_count}.jpg"
                            cv2.imwrite(os.path.join(output_dir, file_name), face_img)
                            saved_count += 1
            except Exception as e:
                print(f"Error at frame {frame_count}: {e}")
        
        frame_count += 1

    cap.release()
    return {"status": "completed", "faces_saved": saved_count}