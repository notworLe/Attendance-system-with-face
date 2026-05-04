import cv2
from torchvision.transforms import ToTensor

def mtcnn_torch_draw(image, faces, probs, *args, **kwargs):
    count_face = 0
    for box, prob in zip(faces, probs):
        # by default x1, y1, x2, y2 is 'object' type
        x1, y1, x2, y2 = [int(x) for x in box]
        cv2.rectangle(image, pt1=(x1, y1), pt2=(x2, y2), color=(173, 250, 93), *args, **kwargs)
        count_face += 1

    cv2.putText(
        img=image,
        text=f"People: {count_face}",
        org=(20, 50),
        fontFace=cv2.FONT_ITALIC,
        fontScale=1,
        color=(173, 250, 93),
        thickness=2
    )

def mtcnn_torch_get_face(image, faces, probs,  *args, **kwargs):
    """
    Crop all face in a image
    :param image:
    :param faces:
    :param probs:
    :param args:
    :param kwargs:
    :return:
    """
    face_list = []
    transform = ToTensor()
    for face, prob in zip(faces, probs):
        x1, y1, x2, y2 = [int(x) for x in face]
        face_resize = cv2.resize(image[y1:y2, x1:x2], (160, 160))
        face_list.append(transform(face_resize))

    return face_list

