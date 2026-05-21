import numpy as np
import cv2
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import InceptionResNetV2


class FaceEmbedder:

    def __init__(self, embedding_dimension=512):
        self.embedding_dimension = embedding_dimension
        self.model = self._build_embedding_model()

    def _build_embedding_model(self):
        base_feature_extractor = InceptionResNetV2(
            weights="imagenet",
            include_top=False,
            input_shape=(160, 160, 3),
            pooling="avg",
        )
        base_feature_extractor.trainable = False

        embedding_input = keras.Input(shape=(160, 160, 3))
        feature_vector = base_feature_extractor(embedding_input)
        embedding_output = layers.Dense(self.embedding_dimension)(feature_vector)

        return keras.Model(inputs=embedding_input, outputs=embedding_output)

    def extract_embedding(self, face_crop):
        resized_face = cv2.resize(face_crop, (160, 160))
        normalized_face = (resized_face.astype(np.float32) - 127.5) / 127.5
        input_batch = np.expand_dims(normalized_face, axis=0)

        raw_embedding = self.model.predict(input_batch, verbose=0)[0]

        embedding_norm = np.linalg.norm(raw_embedding)
        if embedding_norm > 0:
            l2_normalized_embedding = raw_embedding / embedding_norm
        else:
            l2_normalized_embedding = raw_embedding

        return l2_normalized_embedding.astype(np.float32)

    def compute_cosine_similarity(self, embedding_a, embedding_b):
        norm_a = np.linalg.norm(embedding_a)
        norm_b = np.linalg.norm(embedding_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        cosine_similarity = float(np.dot(embedding_a, embedding_b) / (norm_a * norm_b))
        return cosine_similarity

    def serialize_embedding(self, embedding):
        return embedding.astype(np.float32).tobytes()

    def deserialize_embedding(self, embedding_bytes):
        return np.frombuffer(embedding_bytes, dtype=np.float32)
