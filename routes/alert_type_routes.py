from flask import Blueprint, request, jsonify
from db import db

alert_type_bp = Blueprint("alert_type_bp", __name__)

# Create Alert-type
@alert_type_bp.route("/alert-types", methods=["POST"])
def create_alert_type():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO alert_types
        (
            name,
            description
        )
        VALUES
        (
            %s,%s
        )
        RETURNING id
        """,
        (
            data["name"],
            data.get("description")
        )
    )
    
    row = cursor.fetchone()
    if row:
        alert_type_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500

    db.commit()

    return jsonify({
        "message": "Alert type created successfully",
        "id": str(alert_type_id)
    })

# Get All Alert-types
@alert_type_bp.route("/alert-types", methods=["GET"])
def get_alert_types():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            description,
            created_at
        FROM alert_types
        ORDER BY name
        """
    )

    alert_types = cursor.fetchall()

    return jsonify(alert_types)

# Get Alert-type by ID
@alert_type_bp.route("/alert-types/<string:alert_type_id>", methods=["GET"])
def get_alert_type(alert_type_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            description,
            created_at
        FROM alert_types
        WHERE id=%s
        """,
        (alert_type_id,)
    )

    alert_type = cursor.fetchone()

    if not alert_type:
        return jsonify({
            "message": "Alert type not found"
        }), 404

    return jsonify(alert_type)

# Update Alert-type
@alert_type_bp.route("/alert-types/<string:alert_type_id>", methods=["PUT"])
def update_alert_type(alert_type_id):

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE alert_types
        SET
            name=%s,
            description=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data.get("description"),
            alert_type_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Alert type updated successfully"
    })

# Delete Alert-type
@alert_type_bp.route("/alert-types/<string:alert_type_id>", methods=["DELETE"])
def delete_alert_type(alert_type_id):

    cursor = db.cursor()

    cursor.execute(
        """
        DELETE FROM alert_types
        WHERE id=%s
        """,
        (alert_type_id,)
    )

    db.commit()

    return jsonify({
        "message": "Alert type deleted successfully"
    })

# Get camera by alert-type
@alert_type_bp.route("/alert-types/<string:alert_type_id>/cameras", methods=["GET"])
def get_cameras_by_alert_type(alert_type_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            stream_url,
            ip_address,
            status,
            created_at
        FROM cameras
        WHERE alert_type_id=%s
        ORDER BY name
        """,
        (alert_type_id,)
    )

    cameras = cursor.fetchall()

    return jsonify(cameras)
