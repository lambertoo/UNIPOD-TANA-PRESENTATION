import os
import cv2
import numpy as np

WEIGHTS_DIRECTORY = os.path.join(os.path.dirname(__file__), "weights")
SFACE_MODEL_PATH = os.path.join(WEIGHTS_DIRECTORY, "face_recognition_sface.onnx")


class FaceEmbedder:

    def __init__(self, embedding_dimension=128):
        self.embedding_dimension = embedding_dimension
        self.recognizer = cv2.FaceRecognizerSF.create(SFACE_MODEL_PATH, "")

    def extract_embedding(self, face_crop, precomputed_embedding=None, face_aligned=None):
        if precomputed_embedding is not None:
            return precomputed_embedding.astype(np.float32)

        if face_aligned is not None:
            aligned_image = face_aligned
        else:
            aligned_image = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)

        embedding = self.recognizer.feature(aligned_image)
        return embedding.flatten().astype(np.float32)

    def compute_cosine_similarity(self, embedding_a, embedding_b):
        norm_a = np.linalg.norm(embedding_a)
        norm_b = np.linalg.norm(embedding_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(embedding_a, embedding_b) / (norm_a * norm_b))

    def serialize_embedding(self, embedding):
        return embedding.astype(np.float32).tobytes()

    def deserialize_embedding(self, embedding_bytes):
        return np.frombuffer(embedding_bytes, dtype=np.float32)
