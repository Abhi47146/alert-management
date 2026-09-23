import os
import re
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

conf = ConfigParser()
conf.read('config.ini')
CONFIG_INI_PATH = conf.get("File_Path", "CONFIG_INI_PATH")
MEDIAMTX_YML_PATH = conf.get("File_Path", "MEDIAMTX_YML_PATH")
CONFIG_TS_PATH = conf.get("File_Path", "CONFIG_TS_PATH")
MEDIAMTX_API_URL = conf.get("File_Path", "MEDIAMTX_API_URL")
RECORDING_DIRECTORY = conf.get("File_Path", "RECORDING_DIRECTORY")
SCHEMA_NAME = conf.get('DATABASE', 'db_schema', fallback=conf.get('DATABASE', 'db_user', fallback='public'))
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


# 4. Update config.ts

def update_config_ts(camera_name, site_name="Primary Site"):
    if not CONFIG_TS_PATH or not os.path.exists(CONFIG_TS_PATH):
        print(f"[CONFIG.TS ERROR] Path does not exist or is invalid: '{CONFIG_TS_PATH}'")
        return

    try:
        with open(CONFIG_TS_PATH, "r") as f:
            content = f.read()

        stream_url = f"http://localhost:8889/{camera_name}/"
        ip_address = "localhost:8889"

        new_camera_entry = f"""  {{
            id: "{camera_name}",
            name: "{camera_name.capitalize()}",
            streamUrl: "{stream_url}",
            ipAddress: "{ip_address}",
            siteName: "{site_name}",
        }},"""

        # Exact match check to prevent "camera1" matching inside "camera12"
        exact_id_check = f'id: "{camera_name}"'
        if re.search(r'\bid:\s*"' + re.escape(camera_name) + r'"\s*,', content):
            print(f"[CONFIG.TS INFO] Camera ID '{camera_name}' already exists in config.ts")
            return

        # Flexible Regex: Matches LOCAL_CAMERAS with or without type annotations
        pattern = r"(export\s+const\s+LOCAL_CAMERAS\s*(?::\s*[\w\[\]]+)?\s*=\s*\[)([\s\S]*?)(\];)"

        match = re.search(pattern, content)
        if match:
            prefix = match.group(1)
            body = match.group(2)
            suffix = match.group(3)

            # Insert new entry right before the closing bracket ];
            updated_body = body.rstrip() + "\n" + new_camera_entry + "\n"
            updated_content = content[:match.start()] + prefix + updated_body + suffix + content[match.end():]

            with open(CONFIG_TS_PATH, "w") as f:
                f.write(updated_content)

            print(f"[CONFIG.TS SUCCESS] Successfully appended '{camera_name}' to config.ts")
        else:
            # Fallback append before array end
            last_bracket_idx = content.rfind("];")
            if last_bracket_idx != -1:
                updated_content = content[:last_bracket_idx] + new_camera_entry + "\n" + content[last_bracket_idx:]
                with open(CONFIG_TS_PATH, "w") as f:
                    f.write(updated_content)
                print(f"[CONFIG.TS SUCCESS] Appended '{camera_name}' using fallback method.")

    except Exception as e:
        print(f"[CONFIG.TS ERROR] Exception occurred while updating config.ts: {e}")


# 5. Dynamic Stream Health Status Check via MediaMTX API
def check_mediamtx_path_status(camera_name):
    try:
        url = f"{MEDIAMTX_API_URL}/v3/paths/get/{camera_name}"
        resp = requests.get(url, timeout=2)
        if resp.status_code == 200:
            path_info = resp.json()
            if path_info.get("ready", False):
                return "active"
    except Exception:
        pass

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
    site_name = data.get("site_name", "Primary Site")

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
        update_config_ini(camera_name, agent_port, recording_path)
        update_mediamtx_yml(camera_name, rtsp_url, recording_path)
        restart_mediamtx()
        update_config_ts(camera_name, site_name)
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
                True if license_slot_id else False,
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
            "message": "Camera stream & recording added successfully to MediaMTX, config.ini, and config.ts",
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

    try:
        set_schema_query = sql.SQL("SET search_path TO {}, public;").format(
            sql.Identifier(SCHEMA_NAME)
        )
        cursor.execute(set_schema_query)

        cursor.execute(
            """
            SELECT
                id,
                name,
                site_id,
                stream_url,
                agent_port,
                agent_url,
                recording_path,
                status,
                is_licensed,
                license_slot_id,
                registered_by,
                deregistered_at,
                created_at
            FROM kerberos_cameras
            ORDER BY created_at DESC;
            """
        )

        cameras = cursor.fetchall()

        for camera in cameras:
            cam_name = camera.get("name")
            if cam_name:
                camera["status"] = check_mediamtx_path_status(cam_name)

        return jsonify(cameras), 200

    except Exception as err:
        return jsonify({"error": f"Database error: {str(err)}"}), 500