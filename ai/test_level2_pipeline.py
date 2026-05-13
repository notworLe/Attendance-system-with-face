import requests
import time
import os
import glob
import statistics

# ==========================================
# CẤU HÌNH TEST
# ==========================================
API_URL = "http://localhost:8000"
EMAIL = "admin@face.com"      # Sửa thành email của bạn
PASSWORD = "123"         # Sửa thành password của bạn
TASK_ID = 2                      # ID của Lớp/Task dùng để test
SESSION_ID = 11                   # ID của Phiên điểm danh đang ACTIVE

# Thư mục chứa ảnh test. 
# Cấu trúc yêu cầu:
# test_dataset/
# ├── positive/     (Chứa ảnh sinh viên CÓ TRONG lớp, mong đợi: nhận diện thành công)
# └── negative/     (Chứa ảnh người lạ, mong đợi: KHÔNG nhận diện được)
TEST_DIR_POS = "../Dataset/ava"
TEST_DIR_NEG = "../Dataset/data01/data/test/images"

def login():
    """Đăng nhập để lấy JWT Token"""
    print("🔑 Đang đăng nhập...")
    res = requests.post(f"{API_URL}/auth/jwt/login", data={
        "username": EMAIL,
        "password": PASSWORD
    })
    if res.status_code != 200:
        print("❌ Lỗi đăng nhập! Kiểm tra lại EMAIL và PASSWORD.")
        exit(1)
    return res.json()["access_token"]

def test_recognition(image_path, token):
    """Gửi ảnh lên API nhận diện và đo thời gian"""
    url = f"{API_URL}/session/{SESSION_ID}/recognize"
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(image_path, "rb") as f:
        files = {"image": (os.path.basename(image_path), f, "image/jpeg")}
        
        start_time = time.time()
        res = requests.post(url, headers=headers, files=files)
        latency = (time.time() - start_time) * 1000  # Đổi ra mili-giây
        
        if res.status_code != 200:
            print(f"Lỗi API cho ảnh {os.path.basename(image_path)}: {res.text}")
            return None, latency
            
        return res.json(), latency

def run_pipeline_test():
    token = login()
    print("✅ Đăng nhập thành công!\n")
    
    latencies = []
    
    # 1. TEST POSITIVE (Đánh giá FRR - Nhận diện thiếu)
    print("=== BẮT ĐẦU TEST POSITIVE (Sinh viên hợp lệ) ===")
    pos_images = glob.glob(f"{TEST_DIR_POS}/*.jpg") + glob.glob(f"{TEST_DIR_POS}/*.png")
    frr_count = 0  # Số ảnh bị nhận diện thiếu (sai)
    
    if not pos_images:
        print(f"⚠️ Không tìm thấy ảnh positive tại {TEST_DIR_POS}")
    else:
        for img in pos_images:
            res, lat = test_recognition(img, token)
            if res:
                latencies.append(lat)
                # Kiểm tra xem có nhận ra sinh viên nào không
                if len(res.get("recognized", [])) == 0:
                    print(f"❌ FRR Error (Bỏ sót): {os.path.basename(img)} - Latency: {lat:.0f}ms")
                    frr_count += 1
                else:
                    print(f"✅ Pass: {os.path.basename(img)} - Latency: {lat:.0f}ms")
                    
    # 2. TEST NEGATIVE (Đánh giá FAR - Nhận diện nhầm)
    print("\n=== BẮT ĐẦU TEST NEGATIVE (Người lạ) ===")
    neg_images = (glob.glob(f"{TEST_DIR_NEG}/*.jpg") + glob.glob(f"{TEST_DIR_NEG}/*.png"))[:100]
    far_count = 0  # Số ảnh bị nhận diện nhầm thành sinh viên hợp lệ
    
    if not neg_images:
        print(f"⚠️ Không tìm thấy ảnh negative tại {TEST_DIR_NEG}")
    else:
        for img in neg_images:
            res, lat = test_recognition(img, token)
            if res:
                latencies.append(lat)
                # Đáng lẽ không được nhận ra ai
                if len(res.get("recognized", [])) > 0:
                    print(f"❌ FAR Error (Nhận nhầm!): {os.path.basename(img)} - Latency: {lat:.0f}ms")
                    far_count += 1
                else:
                    print(f"✅ Pass: {os.path.basename(img)} - Latency: {lat:.0f}ms")

    # 3. KẾT LUẬN & BÁO CÁO (REPORT)
    total_pos = len(pos_images)
    total_neg = len(neg_images)
    
    print("\n==========================================")
    print("📊 BÁO CÁO KẾT QUẢ TEST LEVEL 2 (PIPELINE)")
    print("==========================================")
    
    if latencies:
        print(f"⏱️  Độ trễ trung bình (Avg Latency) : {statistics.mean(latencies):.0f} ms")
        print(f"⏱️  Độ trễ cao nhất (Max Latency)   : {max(latencies):.0f} ms")
    
    if total_pos > 0:
        frr_rate = (frr_count / total_pos) * 100
        print(f"📉 Tỷ lệ từ chối sai (FRR)         : {frr_rate:.2f}% ({frr_count}/{total_pos} ảnh)")
    
    if total_neg > 0:
        far_rate = (far_count / total_neg) * 100
        print(f"⚠️  Tỷ lệ nhận diện nhầm (FAR)      : {far_rate:.2f}% ({far_count}/{total_neg} ảnh)")
    print("==========================================")

if __name__ == "__main__":
    run_pipeline_test()
