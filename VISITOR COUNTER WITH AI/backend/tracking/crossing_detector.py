import time


class CrossingDetector:
    def __init__(self, door_zone, cooldown_seconds=15):
        self.door_zone = door_zone
        self.cooldown_seconds = cooldown_seconds

        self.object_zone_history = {}
        self.last_event_time_by_id = {}

    def _point_in_door_zone(self, x, y):
        dz = self.door_zone
        return (dz["x"] <= x <= dz["x"] + dz["width"] and
                dz["y"] <= y <= dz["y"] + dz["height"])

    def _get_zone(self, centroid):
        x, y = centroid
        if self._point_in_door_zone(x, y):
            return "door"
        return "room"

    def detect_crossings(self, tracked_objects_update):
        crossing_events = []
        current_time = time.time()

        active_ids = set(tracked_objects_update.keys())

        for object_id, object_data in tracked_objects_update.items():
            centroid = object_data.get("centroid")
            if centroid is None:
                continue

            current_zone = self._get_zone(centroid)
            if current_zone is None:
                continue

            if object_id not in self.object_zone_history:
                self.object_zone_history[object_id] = current_zone
                continue

            previous_zone = self.object_zone_history[object_id]
            self.object_zone_history[object_id] = current_zone

            if previous_zone == current_zone:
                continue

            last_event = self.last_event_time_by_id.get(object_id, 0)
            if current_time - last_event < self.cooldown_seconds:
                continue

            if previous_zone == "door" and current_zone == "room":
                direction = "enter"
            elif previous_zone == "room" and current_zone == "door":
                direction = "exit"
            else:
                continue

            self.last_event_time_by_id[object_id] = current_time

            crossing_events.append({
                "object_id": object_id,
                "direction": direction,
                "face_data": object_data.get("face_data"),
            })

        stale_ids = set(self.object_zone_history.keys()) - active_ids
        for oid in stale_ids:
            del self.object_zone_history[oid]
            self.last_event_time_by_id.pop(oid, None)

        return crossing_events
