import threading
import time
import cv2
import numpy as np

_latest_frame_jpeg = None
_frame_lock = threading.Lock()
_last_frame_timestamp = 0


def update_shared_frame(bgr_frame, face_detections=None, crossing_line_y=None):
    global _latest_frame_jpeg, _last_frame_timestamp

    display_frame = bgr_frame.copy()

    if crossing_line_y is not None:
        cv2.line(
            display_frame,
            (0, crossing_line_y),
            (display_frame.shape[1], crossing_line_y),
            (0, 255, 255),
            2,
        )

    if face_detections:
        for detection in face_detections:
            x, y, w, h = detection["bounding_box"]
            cv2.rectangle(display_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

            label_parts = []
            if detection.get("gender"):
                label_parts.append(detection["gender"].get("gender", ""))
            label_parts.append(f"{detection['confidence']:.0%}")
            label_text = " ".join(label_parts)

            cv2.putText(
                display_frame, label_text, (x, y - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1,
            )

    _, jpeg_encoded = cv2.imencode(".jpg", display_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])

    with _frame_lock:
        _latest_frame_jpeg = jpeg_encoded.tobytes()
        _last_frame_timestamp = time.time()


def read_latest_frame_jpeg():
    with _frame_lock:
        return _latest_frame_jpeg


def is_camera_active(stale_threshold_seconds=5):
    with _frame_lock:
        if _latest_frame_jpeg is None:
            return False
        return (time.time() - _last_frame_timestamp) < stale_threshold_seconds
