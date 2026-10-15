import base64
import os
import uuid

from flask import Blueprint, jsonify, request

from db import db

alert_bp = Blueprint("alert_bp", __name__)

UPLOAD_FOLDER = 'upload'

STATIC_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'static')
DYNAMIC_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'dynamic')

os.makedirs(STATIC_IMAGES_FOLDER, exist_ok=True)
os.makedirs(DYNAMIC_IMAGES_FOLDER, exist_ok=True)

@alert_bp.route("/alerts", methods=["POST"])
def create_alert():
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload data"}), 400

    base64_image = data.get("image_url")  
    saved_url_path = None

    if base64_image:
        try:
            if "base64," in base64_image:
                header, encoded_data = base64_image.split("base64,")
                file_ext = "png" if "png" in header else "gif" if "gif" in header else "jpg"
            else:
                encoded_data = base64_image
                file_ext = "jpg"

            # Decode data
            image_binary = base64.b64decode(encoded_data)
            filename = f"alert_{uuid.uuid4().hex}.{file_ext}"
            
            local_filepath = os.path.join(DYNAMIC_IMAGES_FOLDER, filename)

            with open(local_filepath, "wb") as f:
                f.write(image_binary)

            saved_url_path = f"/upload/dynamic/{filename}"

        except Exception as e:
            return jsonify({"error": f"Failed to decode base64 file string stream: {str(e)}"}), 400
    else:
        saved_url_path = "/upload/static/not_found.png"

    cursor = db.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO alerts 
            (camera_scn, camera_name, site_name, alert_type_name, created_at, image_url)
            VALUES (%s, %s, %s, %s, COALESCE(%s, NOW()), %s)
            RETURNING id;
            """,
            (
                data.get("camera_scn"),
                data.get("camera_name"),
                data.get("site_name"),
                data.get("alert_type_name"),
                data.get("created_at") or None, 
                saved_url_path 
            )
        )
        row = cursor.fetchone()
        db.commit()

        return jsonify({
            "message": "Alert logged successfully",
            "alert_id": str(row["id"]) if isinstance(row, dict) else str(row[0]), 
            "saved_url": saved_url_path
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@alert_bp.route("/alerts", methods=["GET"])
def get_alerts():
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            SELECT 
                id,
                camera_scn,
                camera_name,
                site_name,
                alert_type_name,
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS timestamp,
                image_url
            FROM alerts
            ORDER BY created_at DESC;
            """
        )
        alerts = cursor.fetchall()
        return jsonify(alerts), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500