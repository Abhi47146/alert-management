import configparser
import io
from flask import Blueprint, request, jsonify, Response
from db import db

site_bp = Blueprint("site_bp", __name__)

# Default portal URL constant for all solar sites
DEFAULT_SOLAR_URL = "https://v.dvr163.com/?type=truecloud#/login"


# --- CREATE SITE ---
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
            email,
            password,
            is_active,
            created_by
        )
        VALUES
        (
            %s, %s, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
        """,
        (
            data["name"],
            data.get("location_lat"),
            data.get("location_lng"),
            data.get("address"),
            data.get("email"),     # Nullable for RTSP sites
            data.get("password"),  # Nullable for RTSP sites
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


# --- GET ALL SITES ---
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
            s.email,
            s.password,
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


# --- GET SITE BY ID ---
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
            s.email,
            s.password,
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


# --- UPDATE SITE ---
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
            email=%s,
            password=%s,
            is_active=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data.get("location_lat"),
            data.get("location_lng"),
            data.get("address"),
            data.get("email"),
            data.get("password"),
            data.get("is_active", True),
            site_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Site updated successfully"
    })


# --- DELETE SITE (DEACTIVATE) ---
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


# --- GET ACTIVE SITES ---
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
            address,
            email,
            password
        FROM sites
        WHERE is_active = TRUE
        ORDER BY name
        """
    )

    sites = cursor.fetchall()
    return jsonify(sites)


# --- GET SITE RECIPIENTS ---
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


# --- DYNAMIC INI CONFIG GENERATION FOR SOLAR SITES ---
@site_bp.route("/sites/config", methods=["GET"])
def generate_solar_config():
    """
    Fetches active solar sites (where email and password are not NULL)
    and generates an INI file injecting the DEFAULT_SOLAR_URL dynamically.
    """
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT name, email, password
        FROM sites
        WHERE is_active = TRUE
          AND email IS NOT NULL
          AND password IS NOT NULL
        ORDER BY created_at ASC
        """
    )

    solar_sites = cursor.fetchall()

    config = configparser.ConfigParser()
    
    # Comma-separated list of actual site names
    site_names = [site["name"] for site in solar_sites]
    config["sites"] = {
        "names": ", ".join(site_names)
    }

    # Add dynamic section for each solar site using DEFAULT_SOLAR_URL
    for site in solar_sites:
        site_name = site["name"]
        config[site_name] = {
            "url": DEFAULT_SOLAR_URL,
            "email": site["email"],
            "password": site["password"]
        }

    # Output formatted INI as plain text response
    buf = io.StringIO()
    config.write(buf)

    return Response(buf.getvalue(), mimetype="text/plain")