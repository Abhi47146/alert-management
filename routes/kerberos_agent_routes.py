import os
import requests
import subprocess
import configparser
import yaml
import time
from flask import Blueprint, request, jsonify
from db import db
from configparser import ConfigParser
from psycopg2 import sql

kerberos_bp = Blueprint('kerberos_bp', __name__)

# Parse configuration file
conf = ConfigParser()
conf.read('config.ini')

CONFIG_INI_PATH = conf.get("File_Path", "CONFIG_INI_PATH", fallback="/app/config.ini")
MEDIAMTX_YML_PATH = conf.get("File_Path", "MEDIAMTX_YML_PATH", fallback="/mediamtx.yml")
RECORDING_DIRECTORY = conf.get("File_Path", "RECORDING_DIRECTORY", fallback="/home/abhishek/recordings")
SCHEMA_NAME = conf.get('DATABASE', 'db_schema', fallback=conf.get('DATABASE', 'db_user', fallback='public'))
MEDIAMTX_API_URL = os.getenv("MEDIAMTX_API_URL", "http://mediamtx:9997")
MEDIAMTX_CONTAINER_NAME = "mediamtx"

# 1. Update config.ini
def update_config_ini(camera_name, agent_port, recording_path):
    config = configparser.ConfigParser()
    config.optionxform = str

    if os.path.exists(CONFIG_INI_PATH):
        config.read(CONFIG_INI_PATH)

    if "Kerberos-Recording" not in config:
        config["Kerberos-Recording"] = {}
        config["Kerberos-Recording"]["host_ip"] = "192.168.3.146"

    config["Kerberos-Recording"][camera_name] = str(agent_port)
    config["Kerberos-Recording"][f"{camera_name}_path"] = recording_path

    with open(CONFIG_INI_PATH, "w") as configfile:
        config.write(configfile)


# 2. Update mediamtx.yml
def update_mediamtx_yml(camera_name, rtsp_url, recording_path=None):
    data = {}
    if os.path.exists(MEDIAMTX_YML_PATH):
        with open(MEDIAMTX_YML_PATH, "r") as f:
            data = yaml.safe_load(f) or {}

    if "paths" not in data or data["paths"] is None:
        data["paths"] = {}

    data["paths"][camera_name] = {
        "source": rtsp_url,
        "sourceProtocol": "tcp"
    }

    with open(MEDIAMTX_YML_PATH, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False)


# 3. Restart MediaMTX Docker Container
def restart_mediamtx():
    try:
        subprocess.run(["docker", "restart", MEDIAMTX_CONTAINER_NAME], check=True)
        print(f"[DOCKER] Successfully restarted {MEDIAMTX_CONTAINER_NAME}")
    except subprocess.CalledProcessError as e:
        print(f"[DOCKER ERROR] Failed to restart {MEDIAMTX_CONTAINER_NAME}: {e}")

def get_cameras_from_mediamtx():
    formatted_cameras = []
    if os.path.exists(MEDIAMTX_YML_PATH):
        try:
            with open(MEDIAMTX_YML_PATH, "r") as f:
                data = yaml.safe_load(f) or {}
                paths = data.get("paths", {}) or {}

                for cam_name in paths:
                    formatted_cameras.append({
                        "id": cam_name,
                        "name": cam_name.capitalize(),
                        "streamUrl": f"http://localhost:8889/{cam_name}/",
                        "ipAddress": "localhost:8889",
                        "siteName": "Primary Site",
                        "status": check_mediamtx_path_status(cam_name)
                    })
        except (FileNotFoundError) as e:
            print(f"[ERROR] Failed reading mediamtx.yml: {e}")
            
    return formatted_cameras

def get_all_mediamtx_camera_statuses():
    
    statuses = {}
    try:
        url = f"{MEDIAMTX_API_URL}/v3/paths/list"
        response = requests.get(url, timeout=2)
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            for item in items:
                cam_name = item.get("name", "").lower()
                # A camera is active if 'ready' is True and it has received video tracks
                is_ready = item.get("ready", False) or item.get("available", False)
                statuses[cam_name] = "active" if is_ready else "inactive"
        else:
            print(f"[MEDIAMTX API WARNING] Returned status code {response.status_code}")
    except Exception as e:
        print(f"[MEDIAMTX API ERROR] Could not reach MediaMTX API on port 9997: {e}")
        
    return statuses

def check_mediamtx_path_status(camera_name):
    """
    Queries single camera status via MediaMTX v3 API (/v3/paths/get/<camera_name>).
    """
    try:
        url = f"{MEDIAMTX_API_URL}/v3/paths/get/{camera_name.lower()}"
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            info = response.json()
            if info.get("ready", False) or info.get("available", False):
                return "active"
    except Exception as e:
        print(f"[MEDIAMTX API ERROR] Failed checking single status for {camera_name}: {e}")
        
    return "inactive"


@kerberos_bp.route('/kerberos-cameras', methods=['POST'])
def create_camera():
    data = request.json or {}

    required = ["camera_name", "rtsp_url", "site_id"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    camera_name = data["camera_name"]
    agent_port = int(data.get("agent_port", 1234))
    rtsp_url = data["rtsp_url"]
    site_id = data["site_id"]

    license_slot_id = data.get("license_slot_id")
    registered_by = data.get("registered_by")

    recording_path = f"{RECORDING_DIRECTORY}/{camera_name}"
    agent_url = f"http://localhost:8889/{camera_name}/"

    os.makedirs(recording_path, exist_ok=True)

    try:
        os.chmod(recording_path, 0o777)
    except PermissionError:
        print(f"[WARNING] Skipping chmod: '{recording_path}' permission not modified.")

    try:
        # Update config files and restart MediaMTX
        update_config_ini(camera_name, agent_port, recording_path)
        update_mediamtx_yml(camera_name, rtsp_url, recording_path)
        restart_mediamtx()
        time.sleep(1)
    except Exception as cfg_err:
        return jsonify({"error": f"Failed updating configs or restarting MediaMTX: {str(cfg_err)}"}), 500

    calculated_status = check_mediamtx_path_status(camera_name)

    cursor = db.cursor()

    try:
        set_schema_query = sql.SQL("SET search_path TO {}, public;").format(
            sql.Identifier(SCHEMA_NAME)
        )
        cursor.execute(set_schema_query)

        cursor.execute(
            """
            INSERT INTO kerberos_cameras (
                name,
                site_id,
                stream_url,
                agent_port,
                agent_url,
                recording_path,
                status,
                is_licensed,
                license_slot_id,
                registered_by
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING id, created_at;
            """,
            (
                camera_name,
                site_id,
                rtsp_url,
                agent_port,
                agent_url,
                recording_path,
                calculated_status,
                bool(license_slot_id),
                license_slot_id,
                registered_by
            )
        )

        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Database error"}), 500

        camera_id = row['id']
        created_at = row['created_at']
        db.commit()

        return jsonify({
            "message": "Camera stream & recording added successfully",
            "id": str(camera_id),
            "status": calculated_status,
            "agent_url": agent_url,
            "recording_path": recording_path,
            "created_at": created_at
        }), 201

    except Exception as err:
        db.rollback()
        return jsonify({"error": f"Database error: {str(err)}"}), 500

@kerberos_bp.route('/kerberos-cameras', methods=['GET'])
def get_cameras():
    cursor = db.cursor()

    # Fetch status mapping from MediaMTX API port 9997
    active_statuses = get_all_mediamtx_camera_statuses()

    try:
        set_schema_query = sql.SQL("SET search_path TO {}, public;").format(
            sql.Identifier(SCHEMA_NAME)
        )
        cursor.execute(set_schema_query)

        cursor.execute(
            """
            SELECT
                kc.id,
                kc.name,
                kc.site_id,
                s.name as site_name,
                kc.stream_url,
                kc.agent_port,
                kc.agent_url,
                kc.recording_path,
                kc.status,
                kc.is_licensed,
                kc.license_slot_id,
                kc.registered_by,
                kc.deregistered_at,
                kc.created_at
            FROM kerberos_cameras kc
            LEFT JOIN sites s ON kc.site_id = s.id
            ORDER BY kc.created_at DESC;
            """
        )

        cameras = cursor.fetchall()
        formatted_cameras = []

        for camera in cameras:
            cam_name = camera.get("name", "")
            cam_key = cam_name.lower()
            
            # Lookup status directly from MediaMTX API output
            live_status = active_statuses.get(cam_key, "inactive")

            formatted_cameras.append({
                "id": str(camera.get("id")),
                "name": cam_name.capitalize(),
                "camera_name": cam_name,
                "site_id": str(camera.get("site_id")),
                "siteId": str(camera.get("site_id")),
                "site_name": camera.get("site_name") or "Primary Site",
                "siteName": camera.get("site_name") or "Primary Site",
                "stream_url": camera.get("stream_url"),
                "rtspUrl": camera.get("stream_url"),
                "streamUrl": f"http://localhost:8889/{cam_key}/",
                "status": live_status,
                "created_at": camera.get("created_at")
            })

        return jsonify(formatted_cameras), 200

    except Exception as err:
        print(f"[DB ERROR] Falling back to mediamtx.yml: {err}")
        return jsonify(get_cameras_from_mediamtx()), 200