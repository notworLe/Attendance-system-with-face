import yt_dlp
import cv2

def get_stream_url(youtube_url):
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'quiet': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        return info['url']

url = get_stream_url("https://www.youtube.com/watch?v=3nyPER2kzqk")
cap = cv2.VideoCapture(url)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow("stream", frame)
    if cv2.waitKey(1000//45) & 0xFF == ord('q'):
        break