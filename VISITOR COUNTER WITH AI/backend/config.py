import os
from pathlib import Path

import yaml


PROJECT_ROOT = Path(__file__).resolve().parent.parent

_cached_configuration = None


def load_config():
    global _cached_configuration
    if _cached_configuration is not None:
        return _cached_configuration

    config_file_path = PROJECT_ROOT / "config.yaml"

    if not config_file_path.exists():
        raise FileNotFoundError(
            f"Configuration file not found: {config_file_path}"
        )

    with open(config_file_path, "r") as config_file:
        raw_configuration = yaml.safe_load(config_file)

    _validate_required_sections(raw_configuration)
    _resolve_relative_paths(raw_configuration)

    _cached_configuration = raw_configuration
    return _cached_configuration


def _validate_required_sections(configuration):
    required_sections = [
        "realsense",
        "crossing_line",
        "face_detection",
        "re_identification",
        "gender_classification",
        "paths",
    ]
    for section_name in required_sections:
        if section_name not in configuration:
            raise ValueError(
                f"Missing required configuration section: {section_name}"
            )

    realsense_required_keys = ["width", "height", "fps"]
    for key in realsense_required_keys:
        if key not in configuration["realsense"]:
            raise ValueError(f"Missing realsense config key: {key}")

    crossing_line_required_keys = ["y_position", "direction_threshold"]
    for key in crossing_line_required_keys:
        if key not in configuration["crossing_line"]:
            raise ValueError(f"Missing crossing_line config key: {key}")

    face_detection_required_keys = ["confidence_threshold", "min_face_size"]
    for key in face_detection_required_keys:
        if key not in configuration["face_detection"]:
            raise ValueError(f"Missing face_detection config key: {key}")

    re_id_required_keys = ["similarity_threshold", "embedding_dimension"]
    for key in re_id_required_keys:
        if key not in configuration["re_identification"]:
            raise ValueError(f"Missing re_identification config key: {key}")

    if "confidence_threshold" not in configuration["gender_classification"]:
        raise ValueError(
            "Missing gender_classification config key: confidence_threshold"
        )

    path_required_keys = ["database", "photos"]
    for key in path_required_keys:
        if key not in configuration["paths"]:
            raise ValueError(f"Missing paths config key: {key}")


def _resolve_relative_paths(configuration):
    paths_section = configuration["paths"]
    for path_key in paths_section:
        original_path = Path(paths_section[path_key])
        if not original_path.is_absolute():
            resolved_path = PROJECT_ROOT / original_path
            paths_section[path_key] = str(resolved_path)

    database_directory = Path(paths_section["database"]).parent
    database_directory.mkdir(parents=True, exist_ok=True)

    photos_directory = Path(paths_section["photos"])
    photos_directory.mkdir(parents=True, exist_ok=True)
