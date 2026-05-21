import os
import numpy as np
import cv2
from tensorflow import keras
from tensorflow.keras import layers


class GenderClassifier:

    def __init__(self, confidence_threshold=0.6):
        self.confidence_threshold = confidence_threshold
        self.model = self._build_classification_model()

    def _build_classification_model(self):
        gender_model = keras.Sequential([
            layers.Input(shape=(96, 96, 3)),
            layers.Conv2D(32, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Flatten(),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.5),
            layers.Dense(1, activation="sigmoid"),
        ])
        gender_model.compile(
            optimizer="adam",
            loss="binary_crossentropy",
            metrics=["accuracy"],
        )
        return gender_model

    def classify_gender(self, face_crop):
        resized_face = cv2.resize(face_crop, (96, 96))
        normalized_face = resized_face.astype(np.float32) / 255.0
        input_batch = np.expand_dims(normalized_face, axis=0)

        male_probability = float(self.model.predict(input_batch, verbose=0)[0][0])

        if male_probability > 0.5:
            predicted_gender = "male"
            predicted_confidence = male_probability
        else:
            predicted_gender = "female"
            predicted_confidence = 1.0 - male_probability

        return {
            "gender": predicted_gender,
            "confidence": predicted_confidence,
        }

    def load_pretrained_weights(self, weights_path):
        if os.path.exists(weights_path):
            self.model.load_weights(weights_path)
