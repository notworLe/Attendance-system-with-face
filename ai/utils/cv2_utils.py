import cv2
import os
import numpy as np
from pathlib import Path

class Noise:
    def __int__(self):
        pass

    @staticmethod
    def gaussian_noise(img):
        if not isinstance(img, np.ndarray):
            img = np.array(img)

        mean = 0
        sigma = 25
        gaussian = np.random.normal(mean, sigma, img.shape)

        noisy = img + gaussian
        noisy = np.clip(noisy, 0, 255).astype(np.uint8)
        return noisy

    @staticmethod
    def salt_pepper(img, prob=0.02):
        if not isinstance(img, np.ndarray):
            img = np.array(img)

        noisy = img.copy()

        # Salt (white)
        salt = np.random.rand(*img.shape) < prob / 2
        noisy[salt] = 255

        # Pepper (black)
        pepper = np.random.rand(*img.shape) < prob / 2
        noisy[pepper] = 0

        return noisy

    @staticmethod
    def poisson(img):
        # Đen nhiễu ít
        # Sáng nhiễu nhiều
        if not isinstance(img, np.ndarray):
            img = np.array(img)

        return np.random.poisson(img).astype(np.uint8)

def read_display_img(image, path=False, convert_to_bgr=False, *args, **kwargs):
    if path:
        image = cv2.imread(image, *args, **kwargs)
    if image is None:
        raise ValueError('Invalid image path')

    if convert_to_bgr:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


    print(f'Image shape: {image.shape}')
    print(f'Image dtype: {image.dtype}')

    cv2.imshow('Display', image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def change_format(image, save_path):
    format_template = ['jpg', 'jpeg', 'png']

    format_image = save_path.split('.')[-1]
    if format_image not in format_template:
        raise ValueError('Invalid image format')

    try:
        image = np.array(image)
    except Exception as e:
        raise ValueError('Expected image to be a numpy array')

    cv2.imwrite(save_path, image)


def change_color_space(image, color_space):
    """
    grayscale: one channel with value [0, 255]
    HSV: Hue - Saturation - value
    LAB:
    :param image:
    :param color_space:
    :return:
    """
    color_space_template = ['grayscale', 'HSV', 'LAB']
    color_space_variable = [cv2.COLOR_BGR2GRAY, cv2.COLOR_BGR2HSV, cv2.COLOR_BGR2LAB]

    if color_space not in color_space_template:
        raise ValueError('Invalid color space')

    for i, val in enumerate(color_space_template):
        if color_space == val:
            return cv2.cvtColor(image, color_space_variable[i])

    raise ValueError('Invalid color space')

def crop_image(image, x, y, w, h):
    width = image.shape[1]
    height = image.shape[0]
    if x < 0 or x > width:
        raise ValueError(f'Invalid x position, need lower than {width}')
    if y < 0 or y > height:
        raise ValueError(f'Invalid y position, need lower than {height}')

    if w + x > width:
        raise ValueError(f'Invalid width, is higher than {width}')
    if h + y > height:
        raise ValueError(f'Invalid height, is higher than {height}')

    return image[y:y + h, x:x + w]

def adjust_image_gamma(image, gamma, path=False):
    """

    :param path:
    :param image:
    :param gamma:
    :return:
    """
    if path:
        image = cv2.imread(image)

    # Normalize [0, 1]
    image = image.astype(float) / 255

    # Apply gamma
    image_gamma = image ** gamma

    # Unnormalize
    image_gamma = (image_gamma * 255).astype(np.uint8)
    return image_gamma

def cut_threshold(img, threshold):
    if not isinstance(img, np.ndarray):
        img = np.array(img, dtype=np.uint8)

    if 0 < threshold < 255:
        raise ValueError('Threshold is between 0 and 255')

    img = 1

def adjust_brightness(img, brightness):
    if not isinstance(img, np.ndarray):
        img = np.ndarray(img, dtype=np.uint8)

    return

def make_noise(img, noise):
    pass

def preprocessing_gray_resize(image: np.ndarray, size:tuple):
    if not isinstance(image, np.ndarray):
        image = image

    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Resize nhỏ để giữ cái pattern tổng thể
    # Ảnh lớn chứa các high frequently
    image = cv2.resize(image, dsize=size)
    return image

import cv2
from pathlib import Path

def read_video():
    pass

def read_video_file(video_path, fps=None):
    video_path = Path.cwd() / video_path
    if not Path.exists(video_path):
        raise ValueError(f"Path: {video_path} isn't existed")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Can't open camera")
    fps = fps if fps else int(cap.get(cv2.CAP_PROP_FPS))
    print(f"FPS: {fps}")


    while True:
        is_read, frame = cap.read()
        if not is_read:
            print("Can't find frame")
            break

        cv2.imshow('Video' ,frame)
        if cv2.waitKey(1000 // fps) == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
