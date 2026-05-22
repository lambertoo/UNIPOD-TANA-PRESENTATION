import os
import time
import tempfile
import cv2
import numpy as np

SHARED_DIR = "/tmp"
SHARED_FRAME_PATH = os.path.join(SHARED_DIR, "visitor_counter_frame.jpg")
SHARED_TIMESTAMP_PATH = os.path.join(SHARED_DIR, "visitor_counter_frame.ts")


def update_shared_frame(bgr_frame, face_detections=None, zones_config=None):
    display_frame = bgr_frame.copy()
    overlay = display_frame.copy()

    if zones_config is not None:
        door = zones_config.get("door_zone")

        if door:
            dx, dy, dw, dh = door["x"], door["y"], door["width"], door["height"]
            cv2.rectangle(overlay, (dx, dy), (dx + dw, dy + dh), (0, 200, 255), -1)
            cv2.addWeighted(overlay, 0.15, display_frame, 0.85, 0, display_frame)
            cv2.rectangle(display_frame, (dx, dy), (dx + dw, dy + dh), (0, 200, 255), 2)
            cv2.putText(display_frame, "DOOR ZONE", (dx + 8, dy + 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)

            frame_h, frame_w = display_frame.shape[:2]
            cv2.putText(display_frame, "ROOM ZONE", (dx + dw + 20, 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 100), 2)

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

    _, jpeg_encoded = cv2.imencode(".jpg", display_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    jpeg_bytes = jpeg_encoded.tobytes()

    temp_path = SHARED_FRAME_PATH + ".tmp"
    with open(temp_path, "wb") as frame_file:
        frame_file.write(jpeg_bytes)
    os.replace(temp_path, SHARED_FRAME_PATH)

    with open(SHARED_TIMESTAMP_PATH, "w") as timestamp_file:
        timestamp_file.write(str(time.time()))


def read_latest_frame_jpeg():
    try:
        with open(SHARED_FRAME_PATH, "rb") as frame_file:
            return frame_file.read()
    except (FileNotFoundError, IOError):
        return None


def is_camera_active(stale_threshold_seconds=5):
    try:
        with open(SHARED_TIMESTAMP_PATH, "r") as timestamp_file:
            last_timestamp = float(timestamp_file.read().strip())
        return (time.time() - last_timestamp) < stale_threshold_seconds
    except (FileNotFoundError, IOError, ValueError):
        return False
