from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import shutil
# Import hàm từ file recognition
# Lưu ý: Đảm bảo đường dẫn import đúng với cấu trúc folder của bạn
# from pipeline.recognition import process_video_to_faces 

app = FastAPI(title="Face Attendance API")

# Cấu hình CORS cho Frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Giả lập DB lưu trạng thái Task
tasks_db = {}
STORAGE_PATH = "storage/tasks"
os.makedirs(STORAGE_PATH, exist_ok=True)

async def run_ai_pipeline(task_id: str, video_path: str, interval: float):
    """Tiến trình chạy ngầm xử lý AI."""
    tasks_db[task_id]["status"] = "PROCESSING"
    output_dir = os.path.join(STORAGE_PATH, task_id, "faces")
    
    # Ở đây bạn sẽ gọi hàm từ recognition.py
    # result = process_video_to_faces(video_path, output_dir, interval)
    
    # Giả lập xử lý thành công
    tasks_db[task_id]["status"] = "COMPLETED"
    tasks_db[task_id]["progress"] = 100

@app.post("/api/tasks/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    interval: float = Form(1.0)
):
    # 1. Tạo Task ID duy nhất
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(STORAGE_PATH, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    video_path = os.path.join(task_dir, video.filename)
    
    # 2. Lưu file dùng shutil để tối ưu RAM
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    # 3. Khởi tạo thông tin Task
    tasks_db[task_id] = {
        "status": "PENDING",
        "progress": 0,
        "video_name": video.filename
    }
    
    # 4. Chạy AI trong background
    background_tasks.add_task(run_ai_pipeline, task_id, video_path, interval)
    
    return {"task_id": task_id, "message": "Upload thành công, đang xử lý..."}

@app.get("/api/tasks/{task_id}/status")
async def get_status(task_id: str):
    """Polling API cho Frontend."""
    return tasks_db.get(task_id, {"error": "Task không tồn tại"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)