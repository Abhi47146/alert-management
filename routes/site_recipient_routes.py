from flask import Blueprint, request, jsonify
from db import db

site_recipient_bp = Blueprint("site_recipient_bp",__name__)

# Create site_recipient
@site_recipient_bp.route("/site-recipients", methods=["POST"])
def create_site_recipient():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO site_recipients
        (
            site_id,
            name,
            phone,
            email,
            is_primary,
            added_by
        )
        VALUES
        (
            %s,%s,%s,%s,%s,%s
        )
        RETURNING id
        """,
        (
            data["site_id"],
            data["name"],
            data.get("phone"),
            data.get("email"),
            data.get("is_primary", False),
            data.get("added_by")
        )
    )
    
    row = cursor.fetchone()
    if row:
        recipient_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500
    db.commit()

    return jsonify({
        "message": "Recipient created successfully",
        "id": str(recipient_id)
    })

# Get All site_recipients
@site_recipient_bp.route("/site-recipients", methods=["GET"])
def get_site_recipients():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            sr.id,
            sr.site_id,
            s.name AS site_name,
            sr.name,
            sr.phone,
            sr.email,
            sr.is_primary,
            sr.added_by,
            sr.created_at
        FROM site_recipients sr
        LEFT JOIN sites s
            ON sr.site_id = s.id
        ORDER BY sr.created_at DESC
        """
    )

    recipients = cursor.fetchall()

    return jsonify(recipients)

# Get recipient by id
@site_recipient_bp.route("/site-recipients/<string:recipient_id>", methods=["GET"])
def get_site_recipient(recipient_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            sr.id,
            sr.site_id,
            s.name AS site_name,
            sr.name,
            sr.phone,
            sr.email,
            sr.is_primary,
            sr.added_by,
            sr.created_at
        FROM site_recipients sr
        LEFT JOIN sites s
            ON sr.site_id = s.id
        WHERE sr.id=%s
        """,
        (recipient_id,)
    )

    recipient = cursor.fetchone()

    if not recipient:
        return jsonify({
            "message": "Recipient not found"
        }), 404

    return jsonify(recipient)

# Get recipients by site
@site_recipient_bp.route("/sites/<string:site_id>/recipients", methods=["GET"])
def get_recipients_by_site(site_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            phone,
            email,
            is_primary,
            created_at
        FROM site_recipients
        WHERE site_id=%s
        ORDER BY is_primary DESC, name
        """,
        (site_id,)
    )

    recipients = cursor.fetchall()

    return jsonify(recipients)

# update recipient
@site_recipient_bp.route("/site-recipients/<string:recipient_id>", methods=["PUT"])
def update_site_recipient(recipient_id):

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE site_recipients
        SET
            name=%s,
            phone=%s,
            email=%s,
            is_primary=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data.get("phone"),
            data.get("email"),
            data.get("is_primary", False),
            recipient_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Recipient updated successfully"
    })

# delete recipient
@site_recipient_bp.route("/site-recipients/<string:recipient_id>", methods=["DELETE"])
def delete_site_recipient(recipient_id):

    cursor = db.cursor()

    cursor.execute(
        """
        DELETE FROM site_recipients
        WHERE id=%s
        """,
        (recipient_id,)
    )

    db.commit()

    return jsonify({
        "message": "Recipient deleted successfully"
    })