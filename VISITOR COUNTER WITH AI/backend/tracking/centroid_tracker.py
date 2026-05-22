from collections import OrderedDict
import numpy as np
from scipy.spatial import distance as dist
from scipy.optimize import linear_sum_assignment


class CentroidTracker:
    def __init__(self, max_frames_disappeared=30):
        self.next_object_id = 0
        self.tracked_objects = OrderedDict()
        self.tracked_depths = OrderedDict()
        self.frames_since_last_seen = OrderedDict()
        self.max_frames_disappeared = max_frames_disappeared
        self.tracked_face_data = OrderedDict()

    def register_object(self, centroid, depth, face_data):
        assigned_id = self.next_object_id
        self.tracked_objects[assigned_id] = centroid
        self.tracked_depths[assigned_id] = depth
        self.frames_since_last_seen[assigned_id] = 0
        self.tracked_face_data[assigned_id] = face_data
        self.next_object_id += 1
        return assigned_id

    def deregister_object(self, object_id):
        del self.tracked_objects[object_id]
        del self.tracked_depths[object_id]
        del self.frames_since_last_seen[object_id]
        del self.tracked_face_data[object_id]

    def update(self, face_detections, depth_frame):
        if len(face_detections) == 0:
            ids_to_deregister = []
            for object_id in list(self.frames_since_last_seen.keys()):
                self.frames_since_last_seen[object_id] += 1
                if self.frames_since_last_seen[object_id] > self.max_frames_disappeared:
                    ids_to_deregister.append(object_id)
            for object_id in ids_to_deregister:
                self.deregister_object(object_id)
            return {
                object_id: {
                    "centroid": self.tracked_objects[object_id],
                    "depth": self.tracked_depths[object_id],
                    "face_data": self.tracked_face_data[object_id],
                    "previous_centroid": None,
                    "previous_depth": None,
                }
                for object_id in self.tracked_objects
            }

        new_centroids = []
        new_depths = []
        new_face_data_list = []

        for detection in face_detections:
            bounding_box = detection["bounding_box"]
            x, y, w, h = bounding_box
            centroid_x = x + w / 2
            centroid_y = y + h / 2
            centroid = (centroid_x, centroid_y)
            new_centroids.append(centroid)

            if depth_frame is not None:
                depth_y = int(np.clip(centroid_y, 0, depth_frame.shape[0] - 1))
                depth_x = int(np.clip(centroid_x, 0, depth_frame.shape[1] - 1))
                depth_value = float(depth_frame[depth_y, depth_x])
            else:
                depth_value = 0.0
            new_depths.append(depth_value)

            new_face_data_list.append({
                "face_crop": detection.get("face_crop"),
                "face_aligned": detection.get("face_aligned"),
                "bounding_box": bounding_box,
                "confidence": detection.get("confidence", 0.0),
                "gender": detection.get("gender"),
            })

        if len(self.tracked_objects) == 0:
            result = {}
            for i in range(len(new_centroids)):
                assigned_id = self.register_object(
                    new_centroids[i], new_depths[i], new_face_data_list[i]
                )
                result[assigned_id] = {
                    "centroid": new_centroids[i],
                    "depth": new_depths[i],
                    "face_data": new_face_data_list[i],
                    "previous_centroid": None,
                    "previous_depth": None,
                }
            return result

        existing_ids = list(self.tracked_objects.keys())
        existing_centroids = list(self.tracked_objects.values())

        distance_matrix = dist.cdist(
            np.array(existing_centroids), np.array(new_centroids)
        )

        row_indices, col_indices = linear_sum_assignment(distance_matrix)

        matched_existing_indices = set()
        matched_new_indices = set()
        result = {}

        for row_idx, col_idx in zip(row_indices, col_indices):
            if distance_matrix[row_idx, col_idx] < 100:
                object_id = existing_ids[row_idx]
                previous_centroid = self.tracked_objects[object_id]
                previous_depth = self.tracked_depths[object_id]

                self.tracked_objects[object_id] = new_centroids[col_idx]
                self.tracked_depths[object_id] = new_depths[col_idx]
                self.tracked_face_data[object_id] = new_face_data_list[col_idx]
                self.frames_since_last_seen[object_id] = 0

                result[object_id] = {
                    "centroid": new_centroids[col_idx],
                    "depth": new_depths[col_idx],
                    "face_data": new_face_data_list[col_idx],
                    "previous_centroid": previous_centroid,
                    "previous_depth": previous_depth,
                }

                matched_existing_indices.add(row_idx)
                matched_new_indices.add(col_idx)

        ids_to_deregister = []
        for row_idx, object_id in enumerate(existing_ids):
            if row_idx not in matched_existing_indices:
                self.frames_since_last_seen[object_id] += 1
                if self.frames_since_last_seen[object_id] > self.max_frames_disappeared:
                    ids_to_deregister.append(object_id)
                else:
                    result[object_id] = {
                        "centroid": self.tracked_objects[object_id],
                        "depth": self.tracked_depths[object_id],
                        "face_data": self.tracked_face_data[object_id],
                        "previous_centroid": None,
                        "previous_depth": None,
                    }

        for object_id in ids_to_deregister:
            self.deregister_object(object_id)

        for col_idx in range(len(new_centroids)):
            if col_idx not in matched_new_indices:
                assigned_id = self.register_object(
                    new_centroids[col_idx], new_depths[col_idx], new_face_data_list[col_idx]
                )
                result[assigned_id] = {
                    "centroid": new_centroids[col_idx],
                    "depth": new_depths[col_idx],
                    "face_data": new_face_data_list[col_idx],
                    "previous_centroid": None,
                    "previous_depth": None,
                }

        return result
