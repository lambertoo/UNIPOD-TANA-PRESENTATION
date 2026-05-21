import cv2
import numpy as np
from mtcnn import MTCNN


class FaceDetector:

    def __init__(self, confidence_threshold=0.85, min_face_size=40):
        self.confidence_threshold = confidence_threshold
        self.min_face_size = min_face_size
        self.detector = MTCNN(min_face_size=self.min_face_size)

    def detect_faces(self, color_frame):
        rgb_frame = cv2.cvtColor(color_frame, cv2.COLOR_BGR2RGB)
        raw_detections = self.detector.detect_faces(rgb_frame)

        filtered_faces = []
        for detection in raw_detections:
            detection_confidence = detection["confidence"]
            if detection_confidence < self.confidence_threshold:
                continue

            x, y, width, height = detection["box"]
            x = max(0, x)
            y = max(0, y)

            face_crop_rgb = rgb_frame[y:y + height, x:x + width]

            if face_crop_rgb.size == 0:
                continue

            filtered_faces.append({
                "bounding_box": (x, y, width, height),
                "confidence": detection_confidence,
                "face_crop": face_crop_rgb,
            })

        return filtered_faces
