import cv2
from torch.utils.data import Dataset
from pathlib import Path

class FolderImage(Dataset):
    def __init__(self, root_path:Path):
        if not isinstance(root_path, Path):
            root_path = Path(root_path)

        root_path = (Path.cwd() / root_path).resolve()
        if not root_path.exists():
            raise ValueError(f'{root_path} isn\'t existed')

        self.image_paths = []

        images_in_root = list(root_path.iterdir())
        for image in images_in_root:
            self.image_paths.append(image)

    def __getitem__(self, item):
        if item > self.__len__():
            raise ValueError(f"Index must be lower than {self.__len__()}")

        image_path  = self.image_paths[item]

        # Image name
        name = image_path.name

        iamge = cv2.imread(image_path)

        return iamge, name, image_path


    def __len__(self):
        return len(self.image_paths)

if __name__ == '__main__':
    do_mi_xi_dataset = FolderImage('../dataset/do_mi_xi/raw')
    image, name, path = do_mi_xi_dataset[12]
    print(path)