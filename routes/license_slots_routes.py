from flask import Blueprint, request, jsonify
from db import db

license_slot_bp = Blueprint("license_slot_bp", __name__)

# Create License-Slot
@license_slot_bp.route("/license-slots", methods=["POST"])
def create_license_slot():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO license_slots
        (
            slot_number,
            assigned
        )
        VALUES
        (
            %s,%s
        )
        RETURNING id
        """,
        (
            data["slot_number"],
            data.get("assigned", False)
        )
    )

    slot_id = cursor.fetchone()[0]

    db.commit()

    return jsonify({
        "message": "License slot created successfully",
        "id": str(slot_id)
    })

# Get All License-Slots
@license_slot_bp.route("/license-slots", methods=["GET"])
def get_license_slots():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            slot_number,
            assigned,
            created_at
        FROM license_slots
        ORDER BY slot_number
        """
    )

    slots = cursor.fetchall()

    return jsonify(slots)

@license_slot_bp.route("/license-slots/<string:slot_id>", methods=["GET"])
def get_license_slot(slot_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            slot_number,
            assigned,
            created_at
        FROM license_slots
        WHERE id=%s
        """,
        (slot_id,)
    )

    slot = cursor.fetchone()

    if not slot:
        return jsonify({
            "message": "License slot not found"
        }), 404

    return jsonify(slot)

@license_slot_bp.route("/license-slots/<string:slot_id>", methods=["PUT"])
def update_license_slot(slot_id):

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE license_slots
        SET
            slot_number=%s,
            assigned=%s
        WHERE id=%s
        """,
        (
            data["slot_number"],
            data.get("assigned", False),
            slot_id
        )
    )

    db.commit()

    return jsonify({
        "message": "License slot updated successfully"
    })

# Delete License-Slot
@license_slot_bp.route("/license-slots/<string:slot_id>",methods=["DELETE"])
def delete_license_slot(slot_id):

    cursor = db.cursor()

    cursor.execute(
        """
        DELETE FROM license_slots
        WHERE id=%s
        """,
        (slot_id,)
    )

    db.commit()

    return jsonify({
        "message": "License slot deleted successfully"
    })

# Get Available License-Slot
@license_slot_bp.route("/license-slots/available", methods=["GET"])
def get_available_slots():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            slot_number
        FROM license_slots
        WHERE assigned = FALSE
        ORDER BY slot_number
        """
    )

    slots = cursor.fetchall()

    return jsonify(slots)

# Get Assigned License-Slot
@license_slot_bp.route("/license-slots/assigned", methods=["GET"])
def get_assigned_slots():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            ls.id,
            ls.slot_number,
            c.id AS camera_id,
            c.name AS camera_name
        FROM license_slots ls
        LEFT JOIN cameras c
            ON c.license_slot_id = ls.id
        WHERE ls.assigned = TRUE
        ORDER BY ls.slot_number
        """
    )

    slots = cursor.fetchall()

    return jsonify(slots)

# Assign License-Slot to Camera
@license_slot_bp.route("/license-slots/<string:slot_id>/assign", methods=["PUT"])
def assign_slot(slot_id):

    data = request.json

    cursor = db.cursor()

    camera_id = data["camera_id"]

    cursor.execute(
        """
        UPDATE cameras
        SET
            license_slot_id=%s,
            is_licensed=TRUE
        WHERE id=%s
        """,
        (
            slot_id,
            camera_id
        )
    )

    cursor.execute(
        """
        UPDATE license_slots
        SET assigned=TRUE
        WHERE id=%s
        """,
        (slot_id,)
    )

    db.commit()

    return jsonify({
        "message": "License slot assigned successfully"
    })

# Unassign License-Slot
@license_slot_bp.route("/license-slots/<string:slot_id>/unassign", methods=["PUT"])
def unassign_slot(slot_id):

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE cameras
        SET
            license_slot_id=NULL,
            is_licensed=FALSE
        WHERE license_slot_id=%s
        """,
        (slot_id,)
    )

    cursor.execute(
        """
        UPDATE license_slots
        SET assigned=FALSE
        WHERE id=%s
        """,
        (slot_id,)
    )

    db.commit()

    return jsonify({
        "message": "License slot unassigned successfully"
    })
