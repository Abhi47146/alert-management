import configparser
import io
import json
from datetime import datetime, time
from flask import Blueprint, request, jsonify, Response
from db import db

camera_bp = Blueprint("camera_bp", __name__)


def sanitize_null_str(val):
    """
    Converts literal string "null", empty strings, or None to Python None.
    This prevents saving 'null' as a text string in PostgreSQL.
    """
    if val is None:
        return None
    if isinstance(val, str) and val.strip().lower() in ("null", ""):
        return None
    return val


def serialize_time(val):
    """
    Helper function to sanitize database time values.
    Converts legacy datetime/time objects to ISO strings and
    parses JSON strings into Python lists/dicts for clean JSON serialization.
    """
    if val is None:
        return None
    if isinstance(val, (time, datetime)):
        return val.strftime("%H:%M:%S")
    if isinstance(val, str):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return val
    return str(val)


def extract_all_monitoring_intervals(monitoring_time_data):
    """
    Extracts all monitoring time intervals as lists of start and end times.
    Handles JSON strings, lists of dictionaries, or standard fallbacks.
    Example Input: [{"start": "08:00", "end": "11:00"}, {"start": "11:05", "end": "17:00"}]
    Example Output: (["08:00", "11:05"], ["11:00", "17:00"])
    """
    if not monitoring_time_data:
        return ["00:00"], ["23:59"]

    data = monitoring_time_data
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            return ["00:00"], ["23:59"]

    if isinstance(data, list) and len(data) > 0:
        starts = []
        ends = []
        for slot in data:
            if isinstance(slot, dict):
                starts.append(slot.get("start") or "00:00")
                ends.append(slot.get("end") or "23:59")
        if starts and ends:
            return starts, ends

    return ["00:00"], ["23:59"]


# --- CREATE CAMERA ---
@camera_bp.route("/cameras", methods=["POST"])
def create_camera():
    data = request.json
    cursor = db.cursor()

    raw_stream_url = sanitize_null_str(data.get("stream_url"))
    monitoring_time_val = data.get("monitoring_time") or data.get("monitoring_start_time")

    if isinstance(monitoring_time_val, (list, dict)):
        monitoring_time_val = json.dumps(monitoring_time_val)

    cursor.execute(
        """
        INSERT INTO cameras
        (
            camera_scn,
            name,
            site_id,
            alert_type_id,
            stream_url,
            ip_address,
            username,
            password_encrypted,
            status,
            is_licensed,
            license_slot_id,
            registered_by,
            monitoring_start_time,
            monitoring_end_time,
            is_process
        )
        VALUES
        (
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
        )
        RETURNING id
        """,
        (
            data.get("camera_scn"),
            data.get("name"),
            data.get("site_id"),
            data.get("alert_type_id"),
            raw_stream_url,
            data.get("ip_address"),
            data.get("username"),
            data.get("password_encrypted"),
            data.get("status", "active"),
            data.get("is_licensed", False),
            data.get("license_slot_id"),
            data.get("registered_by"),
            monitoring_time_val,
            data.get("monitoring_end_time"),
            data.get("is_process", False),
        ),
    )
    row = cursor.fetchone()
    if row:
        camera_id = row["id"]
    else:
        return {"error": "Database did not return a UUID"}, 500

    db.commit()

    return jsonify({"message": "Camera created successfully", "id": str(camera_id)})


# --- GET ALL CAMERAS ---
@camera_bp.route("/cameras", methods=["GET"])
def get_cameras():
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            c.id,
            c.camera_scn,
            c.name,
            c.stream_url,
            c.ip_address,
            c.status,
            c.is_licensed,
            c.is_process,
            c.created_at,
            c.monitoring_start_time AS monitoring_time,
            s.id AS site_id,
            s.name AS site_name,
            a.id AS alert_type_id,
            a.name AS alert_type_name
        FROM cameras c
        LEFT JOIN sites s ON c.site_id = s.id
        LEFT JOIN alert_types a ON c.alert_type_id = a.id
        ORDER BY c.created_at DESC
        """
    )

    cameras = cursor.fetchall()

    sanitized_cameras = []
    for camera in cameras:
        if isinstance(camera, dict):
            camera_dict = dict(camera)
            camera_dict["monitoring_time"] = serialize_time(
                camera_dict.get("monitoring_time")
            )
            sanitized_cameras.append(camera_dict)
        else:
            sanitized_cameras.append(camera)

    return jsonify(sanitized_cameras)


# --- GET CAMERA BY ID ---
@camera_bp.route("/cameras/<string:camera_id>", methods=["GET"])
def get_camera(camera_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            c.*,
            s.name AS site_name,
            a.name AS alert_type_name
        FROM cameras c
        LEFT JOIN sites s ON c.site_id = s.id
        LEFT JOIN alert_types a ON c.alert_type_id = a.id
        WHERE c.id=%s
        """,
        (camera_id,),
    )

    camera = cursor.fetchone()

    if not camera:
        return jsonify({"message": "Camera not found"}), 404

    if isinstance(camera, dict):
        camera = dict(camera)
        camera["monitoring_start_time"] = serialize_time(
            camera.get("monitoring_start_time")
        )
        camera["monitoring_end_time"] = serialize_time(
            camera.get("monitoring_end_time")
        )

    return jsonify(camera)


# --- UPDATE CAMERA ---
@camera_bp.route("/cameras/<string:camera_id>", methods=["PUT"])
def update_camera(camera_id):
    data = request.json
    cursor = db.cursor()

    raw_stream_url = sanitize_null_str(data.get("stream_url"))
    monitoring_time_val = data.get("monitoring_time") or data.get("monitoring_start_time")

    if isinstance(monitoring_time_val, (list, dict)):
        monitoring_time_val = json.dumps(monitoring_time_val)

    cursor.execute(
        """
        UPDATE cameras
        SET
            camera_scn = COALESCE(%s, camera_scn),
            name = COALESCE(%s, name),
            site_id = COALESCE(%s, site_id),
            alert_type_id = COALESCE(%s, alert_type_id),
            stream_url = COALESCE(%s, stream_url),
            ip_address = COALESCE(%s, ip_address),
            username = COALESCE(%s, username),
            password_encrypted = COALESCE(%s, password_encrypted),
            status = COALESCE(%s, status),
            is_licensed = COALESCE(%s, is_licensed),
            license_slot_id = COALESCE(%s, license_slot_id),
            monitoring_start_time = COALESCE(%s, monitoring_start_time),
            monitoring_end_time = COALESCE(%s, monitoring_end_time),
            is_process = COALESCE(%s, is_process)
        WHERE id = %s
        """,
        (
            data.get("camera_scn"),
            data.get("name"),
            data.get("site_id"),
            data.get("alert_type_id"),
            raw_stream_url,
            data.get("ip_address"),
            data.get("username"),
            data.get("password_encrypted"),
            data.get("status"),
            data.get("is_licensed"),
            data.get("license_slot_id"),
            monitoring_time_val,
            data.get("monitoring_end_time"),
            data.get("is_process"),
            camera_id,
        ),
    )

    db.commit()

    return jsonify({"message": "Camera updated successfully"})


# --- DELETE CAMERA ---
@camera_bp.route("/cameras/<string:camera_id>", methods=["DELETE"])
def delete_camera(camera_id):
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE cameras
        SET
            status='inactive',
            is_process=FALSE,
            deregistered_at=NOW()
        WHERE id=%s
        """,
        (camera_id,),
    )

    db.commit()

    return jsonify({"message": "Camera deactivated successfully"})


# --- GET CAMERAS BY SITE ---
@camera_bp.route("/sites/<string:site_id>/cameras", methods=["GET"])
def get_cameras_by_site(site_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            camera_scn,
            name,
            status,
            ip_address,
            stream_url
        FROM cameras
        WHERE site_id=%s
        ORDER BY name
        """,
        (site_id,),
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)


# --- GET CAMERAS BY ALERT TYPE ---
@camera_bp.route("/alert-types/<string:alert_type_id>/cameras", methods=["GET"])
def get_cameras_by_alert_type(alert_type_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            camera_scn,
            name,
            status,
            ip_address
        FROM cameras
        WHERE alert_type_id=%s
        ORDER BY name
        """,
        (alert_type_id,),
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)


# --- GET ACTIVE CAMERAS ---
@camera_bp.route("/cameras/active", methods=["GET"])
def get_active_cameras():
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            camera_scn,
            name,
            status,
            ip_address
        FROM cameras
        WHERE status='active'
        ORDER BY name
        """
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)


# --- UPDATE CAMERA STATUS BY SCN ---
@camera_bp.route("/cameras/status/<string:camera_scn>", methods=["PATCH"])
def update_camera_status_by_scn(camera_scn):
    data = request.get_json() or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE cameras
        SET status = %s
        WHERE camera_scn = %s
        RETURNING id
        """,
        (new_status, camera_scn),
    )

    row = cursor.fetchone()
    if not row:
        return jsonify({"error": f"Camera SCN {camera_scn} not found"}), 404

    db.commit()
    return jsonify(
        {
            "message": "Camera status updated successfully",
            "camera_scn": camera_scn,
            "status": new_status,
        }
    ), 200


# --- GET CAMERAS INI CONFIGURATION (MULTIPLE TIME INTERVALS SUPPORT) ---
@camera_bp.route("/cameras/config", methods=["GET"])
def generate_camera_config():
    """
    Generates dynamic INI configuration supporting multiple time intervals.
    `start_time` and `end_time` output comma-separated values matching all intervals.
    """
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT 
            c.camera_scn,
            c.name AS camera_name,
            c.stream_url AS db_stream_url,
            c.is_process,
            c.monitoring_start_time AS monitoring_time,
            c.status,
            s.name AS site_name
        FROM cameras c
        LEFT JOIN sites s ON c.site_id = s.id
        ORDER BY c.created_at ASC
        """
    )

    cameras = cursor.fetchall()
    config = configparser.ConfigParser()

    scns_list = [cam["camera_scn"] for cam in cameras if cam.get("camera_scn")]
    config["camera_scn"] = {
        "scns": ",".join(scns_list)
    }

    for cam in cameras:
        scn = cam["camera_scn"]
        if not scn:
            continue

        clean_url = sanitize_null_str(cam.get("db_stream_url"))
        is_solar = clean_url is None

        camera_name = cam.get("camera_name") or "N/A"

        if is_solar:
            stream_url = f"/var/pnayanam/cctv/{camera_name}"
        else:
            stream_url = clean_url

        start_times, end_times = extract_all_monitoring_intervals(cam.get("monitoring_time"))
        result_storage_path = f"{scn.lower()}_result.mp4"

        config[scn] = {
            "site_name": f'"{cam.get("site_name") or "N/A"}"',
            "name": f'"{camera_name}"',
            "stream_url": stream_url,
            "is_process": str(bool(cam.get("is_process"))),
            "debug": "True",
            "result_storage_path": result_storage_path,
            "start_time": ", ".join(start_times),
            "end_time": ", ".join(end_times),
            "is_solar_cam": str(is_solar),
            "status": cam.get("status") or "active"
        }

    buf = io.StringIO()
    config.write(buf)

    return Response(buf.getvalue(), mimetype="text/plain")