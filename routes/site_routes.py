from flask import Blueprint, request, jsonify
from db import db

site_bp = Blueprint("site_bp", __name__)

# Create site
@site_bp.route("/sites", methods=["POST"])
def create_site():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO sites
        (
            name,
            location_lat,
            location_lng,
            address,
            is_active,
            created_by
        )
        VALUES
        (
            %s,%s,%s,%s,%s,%s
        )
        RETURNING id
        """,
        (
            data["name"],
            data.get("location_lat"),
            data.get("location_lng"),
            data.get("address"),
            data.get("is_active", True),
            data.get("created_by")
        )
    )

    row = cursor.fetchone()
    if row:
        site_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500
    db.commit()

    return jsonify({
        "message": "Site created successfully",
        "id": str(site_id)
    })

# Get All sites
@site_bp.route("/sites", methods=["GET"])
def get_sites():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            s.id,
            s.name,
            s.location_lat,
            s.location_lng,
            s.address,
            s.is_active,
            s.created_at,
            u.name AS created_by_name
        FROM sites s
        LEFT JOIN users u
            ON s.created_by = u.id
        ORDER BY s.created_at DESC
        """
    )

    sites = cursor.fetchall()

    return jsonify(sites)

# Get site by id
@site_bp.route("/sites/<string:site_id>", methods=["GET"])
def get_site(site_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            s.id,
            s.name,
            s.location_lat,
            s.location_lng,
            s.address,
            s.is_active,
            s.created_at,
            u.name AS created_by_name
        FROM sites s
        LEFT JOIN users u
            ON s.created_by = u.id
        WHERE s.id=%s
        """,
        (site_id,)
    )

    site = cursor.fetchone()

    if not site:
        return jsonify({
            "message": "Site not found"
        }), 404

    return jsonify(site)

# update site
@site_bp.route("/sites/<string:site_id>", methods=["PUT"])
def update_site(site_id):

    data = request.json

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE sites
        SET
            name=%s,
            location_lat=%s,
            location_lng=%s,
            address=%s,
            is_active=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data.get("location_lat"),
            data.get("location_lng"),
            data.get("address"),
            data.get("is_active", True),
            site_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Site updated successfully"
    })

# delete site
@site_bp.route("/sites/<string:site_id>", methods=["DELETE"])
def delete_site(site_id):

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE sites
        SET is_active = FALSE
        WHERE id=%s
        """,
        (site_id,)
    )

    db.commit()

    return jsonify({
        "message": "Site deactivated successfully"
    })

# get active sites
@site_bp.route("/sites/active", methods=["GET"])
def get_active_sites():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            location_lat,
            location_lng,
            address
        FROM sites
        WHERE is_active = TRUE
        ORDER BY name
        """
    )

    sites = cursor.fetchall()

    return jsonify(sites)

# get site recipients
@site_bp.route("/sites/<string:site_id>/recipients", methods=["GET"])
def get_site_recipients(site_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            phone,
            email,
            is_primary
        FROM site_recipients
        WHERE site_id=%s
        ORDER BY is_primary DESC
        """,
        (site_id,)
    )

    recipients = cursor.fetchall()

    return jsonify(recipients)