from insightface.app import FaceAnalysis
import cv2
from utils.path_utils import is_path_existed
import numpy as np
from fastapi import HTTPException

app = FaceAnalysis(
    name='buffalo_l',
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider'],
    allowed_modules=['detection', 'recognition']
)
app.prepare(ctx_id=0, det_size=(640, 640))

def embedding_single_face(image):
    faces = app.get(image)
    if len(faces) != 1:
        raise HTTPException(status_code=400, detail="Expected single face in image")
    return faces[0].embedding

def detection_embedding(image):
    faces = app.get(image)
    return faces


def cosine_similarity(human, embedding_list: list):
    embedding = np.array(human)
    results = []

    for stored in embedding_list:
        stored = np.array(stored)
        sim = np.dot(embedding, stored) / (
            np.linalg.norm(embedding) * np.linalg.norm(stored)
        )
        results.append(sim)

    return results

def draw_boxes_on_image(img_copy, recognized_boxes, unrecognized_boxes):
    import base64
    for box, score, name in recognized_boxes:
        x1, y1, x2, y2 = box.astype(int)
        cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
        text = f"{name} ({score:.2f})"
        cv2.putText(img_copy, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
    for box in unrecognized_boxes:
        x1, y1, x2, y2 = box.astype(int)
        cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(img_copy, "Unknown", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
    _, buffer = cv2.imencode('.jpg', img_copy)
    return base64.b64encode(buffer).decode('utf-8')

def crop_faces_from_image(img, boxes):
    import base64
    crops = []
    for box in boxes:
        x1, y1, x2, y2 = box.astype(int)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
        crop_img = img[y1:y2, x1:x2]
        if crop_img.size > 0:
            _, buffer = cv2.imencode('.jpg', crop_img)
            crops.append(base64.b64encode(buffer).decode('utf-8'))
    return crops

if __name__ == '__main__':
    THRESHOLD = 0.6
    # ... rest of code unchanged below but I should just leave this commented or removed for clarity

