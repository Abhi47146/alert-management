import os
import re
from datetime import datetime, timezone, timedelta
from configparser import ConfigParser
from flask import Blueprint, jsonify, request, send_from_directory

recording_bp = Blueprint("recording_bp", __name__)

conf = ConfigParser()
conf.read('config.ini')
CONFIG_INI_PATH = conf.get("File_Path", "CONFIG_INI_PATH")
RECORDING_DIRECTORY = conf.get("File_Path", "RECORDING_DIRECTORY")

# Define IST Timezone (UTC+5:30)
IST_TZ = timezone(timedelta(hours=5, minutes=30))


def get_camera_config(camera_name):
    config = ConfigParser()
    config.optionxform = str
    if os.path.exists(CONFIG_INI_PATH):
        config.read(CONFIG_INI_PATH)

    if "Kerberos-Recording" in config:
        for key in config["Kerberos-Recording"]:
            if key.lower().strip() == camera_name.lower().strip():
                port = config["Kerberos-Recording"][key]
                path_key = f"{key.lower().strip()}_path"
                storage_path = config["Kerberos-Recording"].get(
                    path_key, f"{RECORDING_DIRECTORY}/{camera_name}"
                )
                return port, storage_path

    default_path = f"{RECORDING_DIRECTORY}/{camera_name}"
    if os.path.isdir(default_path):
        return None, default_path

    return None, None


def parse_filename_to_timestamp(filename):
    """
    Parses MediaMTX UTC filenames (YYYY-MM-DD_HH-mm-ss-ffffff.mp4)
    and returns their exact Unix Epoch Timestamp.
    """
    clean_filename = filename.replace(".mp4.mp4", ".mp4")

    # Match MediaMTX format: YYYY-MM-DD_HH-mm-ss-ffffff.mp4
    mediamtx_match = re.match(r"^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})-(\d+)\.mp4$", clean_filename)
    if mediamtx_match:
        date_part, hours, minutes, seconds, sub_seconds = mediamtx_match.groups()
        ms = sub_seconds[:3].ljust(3, "0")
        
        # Parse explicitly as UTC (+00:00)
        iso_str = f"{date_part}T{hours}:{minutes}:{seconds}.{ms}+00:00"
        try:
            dt_utc = datetime.fromisoformat(iso_str)
            return int(dt_utc.timestamp())  # Returns true Unix epoch
        except ValueError:
            return None

    # Match MediaMTX format without microseconds: YYYY-MM-DD_HH-mm-ss.mp4
    mediamtx_simple = re.match(r"^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.mp4$", clean_filename)
    if mediamtx_simple:
        date_part, hours, minutes, seconds = mediamtx_simple.groups()
        iso_str = f"{date_part}T{hours}:{minutes}:{seconds}+00:00"
        try:
            dt_utc = datetime.fromisoformat(iso_str)
            return int(dt_utc.timestamp())
        except ValueError:
            return None

    # Fallback for Legacy Epoch format: 1722763707_xxxx.mp4
    try:
        ts_part = clean_filename.split("_")[0]
        if ts_part.isdigit():
            return int(ts_part)
    except Exception:
        pass

    return None


@recording_bp.route("/kerberos/events", methods=["POST"])
def fetch_kerberos_events():
    data = request.json or {}
    camera_name = data.get("camera_name")

    if not camera_name:
        return jsonify({"error": "camera_name is required"}), 400

    _, recording_dir = get_camera_config(camera_name)

    if not recording_dir or not os.path.isdir(recording_dir):
        return jsonify({"error": f"Recording directory not found or invalid: {recording_dir}"}), 404

    payload = data.get("payload", {})
    start_ts = int(payload.get("timestamp_offset_start", 0))
    end_ts = int(payload.get("timestamp_offset_end", 0))

    if start_ts <= 0 or end_ts <= 0:
        return jsonify({"error": "Invalid timestamp range"}), 400

    if start_ts >= end_ts:
        return jsonify({"error": "Start time must be before end time"}), 400

    MAX_RANGE = 7 * 24 * 60 * 60  # 7 Days
    if end_ts - start_ts > MAX_RANGE:
        return jsonify({"error": "Maximum search range is 7 days"}), 400

    events = []

    try:
        for filename in os.listdir(recording_dir):
            if not filename.endswith(".mp4"):
                continue

            timestamp = parse_filename_to_timestamp(filename)
            if timestamp is None:
                continue

            # Compare epoch timestamps (Timezone independent)
            if start_ts <= timestamp <= end_ts:
                # Convert epoch timestamp to IST (Asia/Kolkata)
                dt_ist = datetime.fromtimestamp(timestamp, tz=timezone.utc).astimezone(IST_TZ)

                events.append({
                    "key": filename,
                    "path": os.path.join(recording_dir, filename),
                    "timestamp": str(timestamp),
                    "day": dt_ist.strftime("%d-%m-%Y"),
                    "short_day": dt_ist.strftime("%b %d"),
                    "time": dt_ist.strftime("%I:%M:%S %p"),  # Formats as "12:10:05 PM" IST
                    "camera_name": camera_name,
                    "camera_key": ""
                })

        # Sort newest recordings first
        events.sort(key=lambda x: int(x["timestamp"]), reverse=True)

        return jsonify({
            "events": events,
            "count": len(events)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recording_bp.route("/kerberos/video-stream", methods=["GET"])
def stream_kerberos_video():
    camera_name = request.args.get("camera_name")
    video_key = request.args.get("key")

    if not camera_name or not video_key:
        return jsonify({"error": "Missing parameters"}), 400

    _, recording_dir = get_camera_config(camera_name)

    if not recording_dir:
        return jsonify({"error": "Camera directory not configured"}), 404

    file_path = os.path.join(recording_dir, video_key)

    if not os.path.exists(file_path):
        return jsonify({"error": "Recording file not found"}), 404

    return send_from_directory(
        recording_dir,
        video_key,
        mimetype="video/mp4",
        as_attachment=False,
    )