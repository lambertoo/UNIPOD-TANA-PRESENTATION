import sys
import os
import signal
import argparse
import time
from datetime import datetime

import numpy as np
import cv2

try:
    import pyrealsense2 as rs
    REALSENSE_AVAILABLE = True
except ImportError:
    REALSENSE_AVAILABLE = False

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import load_config
from backend.database import (
    initialize_database,
    get_database_connection,
    register_new_visitor,
    record_crossing_event,
    find_all_visitor_embeddings,
)
from backend.frame_buffer import update_shared_frame
from backend.models.face_detector import FaceDetector
from backend.models.face_embedder import FaceEmbedder
from backend.models.gender_classifier import GenderClassifier
from backend.tracking.centroid_tracker import CentroidTracker
from backend.tracking.crossing_detector import CrossingDetector

is_running = True


def handle_shutdown_signal(signal_number, stack_frame):
    global is_running
    is_running = False


def parse_command_line_arguments():
    argument_parser = argparse.ArgumentParser(description="Visitor Counter Camera Daemon")
    argument_parser.add_argument("--debug", action="store_true", default=False)
    argument_parser.add_argument(
        "--webcam", action="store_true", default=False,
        help="Use webcam instead of Intel RealSense (for testing)"
    )
    argument_parser.add_argument(
        "--webcam-index", type=int, default=0,
        help="Webcam device index"
    )
    return argument_parser.parse_args()


def configure_realsense_pipeline(realsense_config):
    pipeline = rs.pipeline()
    stream_configuration = rs.config()

    color_width = realsense_config["width"]
    color_height = realsense_config["height"]
    frame_rate = realsense_config["fps"]

    stream_configuration.enable_stream(
        rs.stream.color, color_width, color_height, rs.format.bgr8, frame_rate
    )

    depth_width = min(color_width, 1280)
    depth_height = min(color_height, 720)
    stream_configuration.enable_stream(
        rs.stream.depth, depth_width, depth_height, rs.format.z16, frame_rate
    )

    pipeline.start(stream_configuration)
    depth_to_color_aligner = rs.align(rs.stream.color)

    return pipeline, depth_to_color_aligner


def find_matching_visitor_id(database_connection, face_embedder, query_embedding,
                             similarity_threshold):
    all_visitor_embeddings = find_all_visitor_embeddings(database_connection)

    best_matching_visitor_id = None
    highest_similarity_score = -1.0

    for visitor_id, stored_embedding_bytes in all_visitor_embeddings:
        stored_embedding = face_embedder.deserialize_embedding(stored_embedding_bytes)
        similarity_score = face_embedder.compute_cosine_similarity(
            query_embedding, stored_embedding
        )

        if similarity_score > highest_similarity_score:
            highest_similarity_score = similarity_score
            best_matching_visitor_id = visitor_id

    if highest_similarity_score >= similarity_threshold:
        return best_matching_visitor_id

    return None


def save_visitor_photo(face_crop_rgb, visitor_id, photos_directory):
    current_timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    photo_filename = f"visitor_{visitor_id}_{current_timestamp}.jpg"
    photo_full_path = os.path.join(photos_directory, photo_filename)

    face_crop_bgr = cv2.cvtColor(face_crop_rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(photo_full_path, face_crop_bgr)

    return photo_filename


def draw_debug_overlay(display_frame, face_detections, crossing_line_y):
    cv2.line(
        display_frame,
        (0, crossing_line_y),
        (display_frame.shape[1], crossing_line_y),
        (0, 255, 255),
        2,
    )

    for detection in face_detections:
        x, y, w, h = detection["bounding_box"]
        cv2.rectangle(display_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    return display_frame


def process_crossing_event(crossing_event, face_embedder, gender_classifier,
                           database_connection, configuration):
    face_data = crossing_event["face_data"]
    face_crop_rgb = face_data["face_crop"]
    crossing_direction = crossing_event["direction"]
    detection_confidence = face_data["confidence"]

    face_aligned = face_data.get("face_aligned")
    face_embedding = face_embedder.extract_embedding(
        face_crop_rgb, face_aligned=face_aligned
    )

    precomputed_gender = face_data.get("gender")
    gender_prediction = gender_classifier.classify_gender(
        face_crop_rgb, precomputed_gender=precomputed_gender
    )
    predicted_gender = gender_prediction["gender"]
    gender_confidence = gender_prediction["confidence"]

    similarity_threshold = configuration["re_identification"]["similarity_threshold"]
    photos_directory = configuration["paths"]["photos"]

    matched_visitor_id = find_matching_visitor_id(
        database_connection, face_embedder, face_embedding, similarity_threshold
    )

    if matched_visitor_id is not None:
        visitor_id = matched_visitor_id
        photo_filename = save_visitor_photo(face_crop_rgb, visitor_id, photos_directory)
        record_crossing_event(
            database_connection, visitor_id, crossing_direction,
            detection_confidence, photo_filename
        )
    else:
        serialized_embedding = face_embedder.serialize_embedding(face_embedding)
        temporary_photo_filename = "pending.jpg"
        visitor_id = register_new_visitor(
            database_connection, predicted_gender, gender_confidence,
            serialized_embedding, temporary_photo_filename
        )
        photo_filename = save_visitor_photo(face_crop_rgb, visitor_id, photos_directory)

        database_connection.execute(
            "UPDATE visitors SET photo_filename = ? WHERE id = ?",
            (photo_filename, visitor_id)
        )
        database_connection.commit()

        record_crossing_event(
            database_connection, visitor_id, crossing_direction,
            detection_confidence, photo_filename
        )

    event_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    print(
        f"[{event_timestamp}] Visitor {visitor_id} | "
        f"Direction: {crossing_direction} | Gender: {predicted_gender}"
    )


def capture_frames_from_realsense(configuration):
    realsense_pipeline, depth_to_color_aligner = configure_realsense_pipeline(
        configuration["realsense"]
    )
    try:
        while is_running:
            raw_frames = realsense_pipeline.wait_for_frames()
            aligned_frames = depth_to_color_aligner.process(raw_frames)

            color_frame = aligned_frames.get_color_frame()
            depth_frame = aligned_frames.get_depth_frame()

            if not color_frame or not depth_frame:
                continue

            color_image = np.asanyarray(color_frame.get_data())
            depth_image = np.asanyarray(depth_frame.get_data()).astype(np.uint16)
            yield color_image, depth_image
    finally:
        realsense_pipeline.stop()


def capture_frames_from_webcam(webcam_index, frame_width, frame_height):
    webcam_capture = cv2.VideoCapture(webcam_index)
    webcam_capture.set(cv2.CAP_PROP_FRAME_WIDTH, frame_width)
    webcam_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, frame_height)

    if not webcam_capture.isOpened():
        raise RuntimeError(f"Cannot open webcam at index {webcam_index}")

    try:
        while is_running:
            read_success, color_image = webcam_capture.read()
            if not read_success:
                continue

            simulated_depth_image = np.full(
                (color_image.shape[0], color_image.shape[1]),
                1000, dtype=np.uint16
            )
            yield color_image, simulated_depth_image
    finally:
        webcam_capture.release()


def run_camera_daemon(command_line_args):
    global is_running

    signal.signal(signal.SIGINT, handle_shutdown_signal)
    signal.signal(signal.SIGTERM, handle_shutdown_signal)

    configuration = load_config()
    database_path = configuration["paths"]["database"]
    initialize_database(database_path)
    database_connection = get_database_connection(database_path)

    face_detector = FaceDetector(
        confidence_threshold=configuration["face_detection"]["confidence_threshold"],
        min_face_size=configuration["face_detection"]["min_face_size"],
    )
    face_embedder = FaceEmbedder(
        embedding_dimension=configuration["re_identification"]["embedding_dimension"],
    )
    gender_classifier = GenderClassifier(
        confidence_threshold=configuration["gender_classification"]["confidence_threshold"],
    )
    centroid_tracker = CentroidTracker()
    zones_config = configuration["crossing_zones"]
    crossing_detector = CrossingDetector(
        door_zone=zones_config["door_zone"],
        cooldown_seconds=zones_config.get("cooldown_seconds", 15),
    )

    use_webcam = command_line_args.webcam or not REALSENSE_AVAILABLE
    is_debug_enabled = command_line_args.debug

    if use_webcam:
        if not REALSENSE_AVAILABLE:
            print("pyrealsense2 not installed — falling back to webcam mode.")
        else:
            print("Webcam mode enabled via --webcam flag.")
        frame_source = capture_frames_from_webcam(
            command_line_args.webcam_index,
            configuration["realsense"]["width"],
            configuration["realsense"]["height"],
        )
    else:
        print("Using Intel RealSense camera.")
        frame_source = capture_frames_from_realsense(configuration)

    print("Camera daemon started. Press Ctrl+C to stop.")

    try:
        for color_image, depth_image in frame_source:
            if not is_running:
                break

            face_detections = face_detector.detect_faces(color_image)

            for detection in face_detections:
                gender_result = gender_classifier.classify_gender(detection["face_crop"])
                detection["gender"] = gender_result

            tracked_objects_update = centroid_tracker.update(face_detections, depth_image)

            crossing_events = crossing_detector.detect_crossings(tracked_objects_update)

            for crossing_event in crossing_events:
                face_data = crossing_event.get("face_data")
                if face_data is None or face_data.get("face_crop") is None:
                    continue

                process_crossing_event(
                    crossing_event, face_embedder, gender_classifier,
                    database_connection, configuration
                )

            update_shared_frame(color_image, face_detections, zones_config)

            if is_debug_enabled:
                debug_frame = color_image.copy()
                cv2.imshow("Visitor Counter Debug", debug_frame)

                pressed_key = cv2.waitKey(1) & 0xFF
                if pressed_key == ord("q"):
                    is_running = False

    finally:
        database_connection.close()
        if is_debug_enabled:
            cv2.destroyAllWindows()
        print("Camera daemon stopped.")


if __name__ == "__main__":
    parsed_arguments = parse_command_line_arguments()
    run_camera_daemon(parsed_arguments)
