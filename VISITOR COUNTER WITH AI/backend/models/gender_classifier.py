class GenderClassifier:

    def __init__(self, confidence_threshold=0.6):
        self.confidence_threshold = confidence_threshold

    def classify_gender(self, face_crop, precomputed_gender=None):
        if precomputed_gender is not None:
            return precomputed_gender

        return {"gender": "unknown", "confidence": 0.0}
