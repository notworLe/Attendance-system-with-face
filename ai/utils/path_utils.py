from pathlib import Path

def is_path_existed(path: str):
    current = Path.cwd()
    path = current / path
    if Path.exists(path):
       return path
    else:
        raise ValueError(f"Path: {path} isn't existed")
