import cv2
from pathlib import Path
from retinaface import RetinaFace
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))
# Configuration
VIDEO_PATH = 'data/video/crowded2.mp4'
FPS = 5
DETECT_PER_FRAME = 5



video_path = Path.cwd() / VIDEO_PATH
if not Path.exists(video_path):
    raise ValueError(f"Path: {video_path} isn't existed")

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    raise ValueError("Can't open camera")
fps = FPS if FPS else int(cap.get(cv2.CAP_PROP_FPS))
width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
heigh = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
print(f"FPS: {fps}")
print(f"Width: {width}")
print(f"Heigh: {heigh}")

frame_count = 0
faces = {}
while True:
    is_read, frame = cap.read()
    if not is_read:
        print("Can't find frame")
        break
    if cv2.waitKey(1000 // fps) == ord('q'):
        break

    if frame_count % DETECT_PER_FRAME == 0:
        faces = RetinaFace.detect_faces(frame)

    for key, val in faces.items():
        x1, y1, x2, y2 = val['facial_area']
        cv2.rectangle(frame, (x1, y1), (x2, y2), color=(41, 245, 214), thickness=2)

    cv2.imshow('Video' ,frame)

    frame_count += 1


cap.release()
cv2.destroyAllWindows()

