import os
import cv2
import numpy as np

WEIGHTS_DIRECTORY = os.path.join(os.path.dirname(__file__), "weights")
YUNET_MODEL_PATH = os.path.join(WEIGHTS_DIRECTORY, "face_detection_yunet_2023mar.onnx")


class FaceDetector:

    def __init__(self, confidence_threshold=0.85, min_face_size=40):
        self.confidence_threshold = confidence_threshold
        self.min_face_size = min_face_size
        self.detector = None

    def _ensure_detector(self, frame_width, frame_height):
        if self.detector is None:
            self.detector = cv2.FaceDetectorYN.create(
                YUNET_MODEL_PATH, "", (frame_width, frame_height),
                self.confidence_threshold, 0.3, 5000,
            )
        else:
            self.detector.setInputSize((frame_width, frame_height))

    def detect_faces(self, color_frame):
        frame_height, frame_width = color_frame.shape[:2]
        self._ensure_detector(frame_width, frame_height)

        _, raw_detections = self.detector.detect(color_frame)
        if raw_detections is None:
            return []

        filtered_faces = []
        for detection in raw_detections:
            x = int(detection[0])
            y = int(detection[1])
            width = int(detection[2])
            height = int(detection[3])
            detection_confidence = float(detection[-1])

            if detection_confidence < self.confidence_threshold:
                continue
            if width < self.min_face_size or height < self.min_face_size:
                continue

            x = max(0, x)
            y = max(0, y)
            x_end = min(frame_width, x + width)
            y_end = min(frame_height, y + height)
            width = x_end - x
            height = y_end - y

            face_crop_rgb = cv2.cvtColor(
                color_frame[y:y_end, x:x_end], cv2.COLOR_BGR2RGB
            )
            if face_crop_rgb.size == 0:
                continue

            face_aligned = self._align_face(color_frame, detection)

            face_data = {
                "bounding_box": (x, y, width, height),
                "confidence": detection_confidence,
                "face_crop": face_crop_rgb,
                "face_aligned": face_aligned,
                "yunet_detection": detection,
            }
            filtered_faces.append(face_data)

        return filtered_faces

    def _align_face(self, color_frame, detection):
        try:
            face_aligned = cv2.FaceRecognizerSF.alignCrop(color_frame, detection)
            return face_aligned
        except Exception:
            x, y, w, h = int(detection[0]), int(detection[1]), int(detection[2]), int(detection[3])
            return color_frame[y:y+h, x:x+w]
