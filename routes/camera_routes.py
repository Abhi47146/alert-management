from flask import Blueprint, request, jsonify
from db import db

camera_bp = Blueprint("camera_bp", __name__)

# Create Camera
@camera_bp.route("/cameras", methods=["POST"])
def create_camera():

    data = request.json
    cursor = db.cursor()

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
            monitoring_end_time
        )
        VALUES
        (
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
        )
        RETURNING id
        """,
        (
            data.get("camera_scn"),
            data.get("name"),
            data.get("site_id"),
            data.get("alert_type_id"),
            data.get("stream_url"),
            data.get("ip_address"),
            data.get("username"),
            data.get("password_encrypted"),
            data.get("status", "active"),
            data.get("is_licensed", False),
            data.get("license_slot_id"),
            data.get("registered_by"),
            data.get("monitoring_start_time"),
            data.get("monitoring_end_time")
        )
    )
    row = cursor.fetchone()
    if row:
        camera_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500

    db.commit()

    return jsonify({
        "message": "Camera created successfully",
        "id": str(camera_id)
    })

# Get all Camera
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
            -- Convert TIMESTAMPTZ/TIME objects to ISO strings directly in SQL
            TO_CHAR(c.monitoring_start_time, 'HH24:MI:SS') AS monitoring_start_time,
            TO_CHAR(c.monitoring_end_time, 'HH24:MI:SS') AS monitoring_end_time,

            s.id AS site_id,
            s.name AS site_name,

            a.id AS alert_type_id,
            a.name AS alert_type_name

        FROM cameras c

        LEFT JOIN sites s
            ON c.site_id = s.id

        LEFT JOIN alert_types a
            ON c.alert_type_id = a.id

        ORDER BY c.created_at DESC
        """
    )

    cameras = cursor.fetchall()
    return jsonify(cameras)

# Get camera by ID
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
        LEFT JOIN sites s
            ON c.site_id = s.id
        LEFT JOIN alert_types a
            ON c.alert_type_id = a.id
        WHERE c.id=%s
        """,
        (camera_id,)
    )

    camera = cursor.fetchone()

    if not camera:
        return jsonify({
            "message": "Camera not found"
        }), 404

    return jsonify(camera)

# Update Camera
@camera_bp.route("/cameras/<string:camera_id>", methods=["PUT"])
def update_camera(camera_id):

    data = request.json
    cursor = db.cursor()

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
            data.get("stream_url"),
            data.get("ip_address"),
            data.get("username"),
            data.get("password_encrypted"),
            data.get("status"),
            data.get("is_licensed", False),
            data.get("license_slot_id"),
            data.get("monitoring_start_time"),
            data.get("monitoring_end_time"),
            data.get("is_process", False),
            camera_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Camera updated successfully"
    })

# Delete Camera
@camera_bp.route("/cameras/<string:camera_id>", methods=["DELETE"])
def delete_camera(camera_id):

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE cameras
        SET
            status='inactive',
            deregistered_at=NOW()
        WHERE id=%s
        """,
        (camera_id,)
    )

    db.commit()

    return jsonify({
        "message": "Camera deactivated successfully"
    })

# Get Camera by Site
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
        (site_id,)
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)

# Get Camera by alert-type
@camera_bp.route("/alert-types/<string:alert_type_id>/cameras",methods=["GET"])
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
        (alert_type_id,)
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)

# Get Active Cameras
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