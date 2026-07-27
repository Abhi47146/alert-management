from flask import Blueprint, jsonify, request
import shutil
import socket
from configparser import ConfigParser

health_bp = Blueprint("health_bp", __name__)

conf = ConfigParser()
conf.read('config.ini')
storage_path = conf.get("DATABASE", "storage_path")
edge_health = {}

def bytes_to_gb(value):
    return round(value / (1024 ** 3), 2)

@health_bp.route("/cloud-health", methods=["GET"])
def cloud_health():

    total, used, free = shutil.disk_usage(storage_path)

    used_percent = round((used / total) * 100)

    if used_percent < 80:
        status = "Operational"
    elif used_percent < 90:
        status = "Degraded"
    else:
        status = "Critical"

    response = [{
        "node_name": socket.gethostname(),
        "status": status,
        "uptime_percentage": 99.9,
        "latency_ms": 2,
        "storage": {
            "total_space_gb": bytes_to_gb(total),
            "used_space_gb": bytes_to_gb(used),
            "available_space_gb": bytes_to_gb(free)
        }
    }]

    return jsonify(response)

@health_bp.route("/edge-health", methods=["POST"])
def update_edge_health():

    data = request.json

    node_name = data["node_name"]

    edge_health[node_name] = data

    return jsonify({
        "message": "received"
    })

@health_bp.route("/edge-health", methods=["GET"])
def get_edge_health():

    return jsonify(list(edge_health.values()))