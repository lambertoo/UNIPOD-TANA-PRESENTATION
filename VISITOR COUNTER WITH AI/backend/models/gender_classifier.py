import os
import cv2
import numpy as np

WEIGHTS_DIRECTORY = os.path.join(os.path.dirname(__file__), "weights")
GENDER_PROTOTXT_PATH = os.path.join(WEIGHTS_DIRECTORY, "gender_deploy.prototxt")
GENDER_CAFFEMODEL_PATH = os.path.join(WEIGHTS_DIRECTORY, "gender_net.caffemodel")

GENDER_LABELS = ["Male", "Female"]
GENDER_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)


class GenderClassifier:

    def __init__(self, confidence_threshold=0.6):
        self.confidence_threshold = confidence_threshold
        self.network = None
        self.model_available = False
        self._load_model()

    def _load_model(self):
        if not os.path.isfile(GENDER_PROTOTXT_PATH):
            return
        if not os.path.isfile(GENDER_CAFFEMODEL_PATH):
            return
        if os.path.getsize(GENDER_CAFFEMODEL_PATH) < 1_000_000:
            return

        try:
            self.network = cv2.dnn.readNetFromCaffe(
                GENDER_PROTOTXT_PATH, GENDER_CAFFEMODEL_PATH
            )
            self.model_available = True
        except cv2.error:
            self.network = None
            self.model_available = False

    def classify_gender(self, face_crop_rgb, precomputed_gender=None):
        if precomputed_gender is not None:
            return precomputed_gender

        if not self.model_available:
            self._load_model()
            if not self.model_available:
                return {"gender": "unknown", "confidence": 0.0}

        face_bgr = cv2.cvtColor(face_crop_rgb, cv2.COLOR_RGB2BGR)
        blob = cv2.dnn.blobFromImage(
            face_bgr, 1.0, (227, 227), GENDER_MEAN_VALUES, swapRB=False
        )
        self.network.setInput(blob)
        predictions = self.network.forward()

        predicted_index = predictions[0].argmax()
        predicted_confidence = float(predictions[0][predicted_index])
        predicted_gender = GENDER_LABELS[predicted_index]

        if predicted_confidence < self.confidence_threshold:
            return {"gender": "unknown", "confidence": predicted_confidence}

        return {"gender": predicted_gender, "confidence": predicted_confidence}
