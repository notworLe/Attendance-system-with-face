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

def draw_box(img, box, det_score):
    img_draw = img.copy()

    box = box.astype(int)
    x1, y1, x2, y2 = box
    cv2.rectangle(img_draw, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # Thêm confidence score
    score = f"{det_score:.2f}"
    cv2.putText(img_draw, score, (x1, y1 - 10),
    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.imshow('img', img_draw)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == '__main__':
    THRESHOLD = 0.6
    # img_path = is_path_existed('pipeline/data/img/Screenshot (29).png')
    domixi_path = is_path_existed('data/domixi.png')
    domixi_tem_path = is_path_existed('data/domixi_team5.png')

    domixi = cv2.imread(domixi_path)
    domixi_team = cv2.imread(domixi_tem_path)
    embed = embedding_single_face(domixi)
    # print(embed)

    detect_embed = detection_embedding(domixi_team)
    embed_list = [face.embedding for face in detect_embed]
    # print(embed_list)
    # print(detect_embed)
    cosine = cosine_similarity(embed, embed_list)
    draw_box(domixi_team, detect_embed[np.argmax(cosine)].bbox, cosine[np.argmax(cosine)])
