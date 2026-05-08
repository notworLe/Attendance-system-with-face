import cv2
from retinaface import RetinaFace
from ai.utils.path_utils import is_path_existed
from ai.utils.cv2_utils import crop_image
from pprint import pprint
import numpy as np

# Configuration
IMAGE_PATH = 'data/img/class.jpg'


IMAGE_PATH = is_path_existed(IMAGE_PATH)

#
# def is_likely_real_face(face_crop, label):
#     if face_crop is None or face_crop.size == 0:
#         return False
#     if face_crop.shape[0] < 20 or face_crop.shape[1] < 20:
#         return False
#
#     gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
#     lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
#
#     hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
#     sat_std = np.std(hsv[:, :, 1])
#
#     sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
#     sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
#     gradient_mean = np.mean(np.sqrt(sobelx ** 2 + sobely ** 2))
#
#     print(f"[{label}] lap_var={lap_var:.1f}, sat_std={sat_std:.1f}, grad={gradient_mean:.1f}")
#
#     return lap_var > 40 and sat_std > 15 and gradient_mean > 8

def face_detection(picture):
    faces = RetinaFace.detect_faces(picture)
    return faces

def draw_box(picture, boxes):
    for key, val in boxes.items():
        x1, y1, x2, y2 = val['facial_area']
        cv2.rectangle(picture, (x1, y1), (x2, y2), color=(41, 245, 214), thickness=2)


img = cv2.imread(IMAGE_PATH)
boxes = face_detection(IMAGE_PATH)
draw_box(img, boxes)


cv2.imshow('cc', img)


cv2.waitKey(0)
cv2.destroyAllWindows()

