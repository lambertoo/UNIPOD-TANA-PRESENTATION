class CrossingDetector:
    def __init__(self, crossing_line_y=240, direction_threshold=20):
        self.crossing_line_y = crossing_line_y
        self.direction_threshold = direction_threshold
        self.already_crossed_ids = set()

    def detect_crossings(self, tracked_objects_update):
        crossing_events = []

        for object_id, object_data in tracked_objects_update.items():
            current_centroid = object_data.get("centroid")
            previous_centroid = object_data.get("previous_centroid")

            if current_centroid is None or previous_centroid is None:
                continue

            current_y = current_centroid[1]
            previous_y = previous_centroid[1]

            crossed_downward = previous_y < self.crossing_line_y and current_y >= self.crossing_line_y
            crossed_upward = previous_y > self.crossing_line_y and current_y <= self.crossing_line_y

            if not crossed_downward and not crossed_upward:
                continue

            if object_id in self.already_crossed_ids:
                continue

            current_depth = object_data.get("depth", 0.0)
            previous_depth = object_data.get("previous_depth", 0.0)

            if current_depth is not None and previous_depth is not None:
                depth_change = current_depth - previous_depth
            else:
                depth_change = 0.0

            if abs(depth_change) >= self.direction_threshold:
                if depth_change < 0:
                    direction = "enter"
                else:
                    direction = "exit"
            else:
                if current_y > previous_y:
                    direction = "enter"
                else:
                    direction = "exit"

            self.already_crossed_ids.add(object_id)

            crossing_events.append({
                "object_id": object_id,
                "direction": direction,
                "face_data": object_data.get("face_data"),
            })

        return crossing_events

    def reset_crossed_id(self, object_id):
        self.already_crossed_ids.discard(object_id)
