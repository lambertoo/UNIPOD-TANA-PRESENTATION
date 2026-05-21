import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceDetector:

    def __init__(self, confidence_threshold=0.85, min_face_size=40):
        self.confidence_threshold = confidence_threshold
        self.min_face_size = min_face_size
        self.face_analyzer = FaceAnalysis(
            name="buffalo_s",
            providers=["CPUExecutionProvider"],
        )
        self.face_analyzer.prepare(ctx_id=-1, det_size=(640, 480))

    def detect_faces(self, color_frame):
        rgb_frame = cv2.cvtColor(color_frame, cv2.COLOR_BGR2RGB)
        detected_faces = self.face_analyzer.get(rgb_frame)

        filtered_faces = []
        for face in detected_faces:
            detection_confidence = float(face.det_score)
            if detection_confidence < self.confidence_threshold:
                continue

            bbox = face.bbox.astype(int)
            x = max(0, bbox[0])
            y = max(0, bbox[1])
            x_end = min(color_frame.shape[1], bbox[2])
            y_end = min(color_frame.shape[0], bbox[3])
            width = x_end - x
            height = y_end - y

            if width < self.min_face_size or height < self.min_face_size:
                continue

            face_crop_rgb = rgb_frame[y:y_end, x:x_end]
            if face_crop_rgb.size == 0:
                continue

            face_data = {
                "bounding_box": (x, y, width, height),
                "confidence": detection_confidence,
                "face_crop": face_crop_rgb,
                "embedding": face.normed_embedding if hasattr(face, "normed_embedding") else None,
                "gender": self._extract_gender(face),
            }
            filtered_faces.append(face_data)

        return filtered_faces

    def _extract_gender(self, face):
        if hasattr(face, "gender") and face.gender is not None:
            predicted_gender = "male" if face.gender == 1 else "female"
            return {"gender": predicted_gender, "confidence": 0.9}
        return None
