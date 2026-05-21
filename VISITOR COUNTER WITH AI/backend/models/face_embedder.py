import numpy as np


class FaceEmbedder:

    def __init__(self, embedding_dimension=512):
        self.embedding_dimension = embedding_dimension

    def extract_embedding(self, face_crop, precomputed_embedding=None):
        if precomputed_embedding is not None:
            return precomputed_embedding.astype(np.float32)

        from insightface.app import FaceAnalysis
        analyzer = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
        analyzer.prepare(ctx_id=-1)
        import cv2
        bgr_crop = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
        faces = analyzer.get(bgr_crop)
        if faces:
            return faces[0].normed_embedding.astype(np.float32)
        return np.zeros(self.embedding_dimension, dtype=np.float32)

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
