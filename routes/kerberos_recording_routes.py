# from flask import Blueprint, jsonify, request
# import requests

# recording_bp = Blueprint("dashboard_bp", __name__)

# @recording_bp.route("/api/kerberos/events", methods=["POST"])
# def fetch_kerberos_events():
#     data = request.json or {}
    
#     # Extract agent connection details from frontend
#     agent_ip = data.get("ip")
#     agent_port = data.get("port")
    
#     if not agent_ip or not agent_port:
#         return jsonify({"error": "Missing agent configuration parameters (IP or Port)"}), 400

#     # Extract dynamic timeline selection offsets chosen by the user
#     payload = data.get("payload", {})
#     agent_payload = {
#         "number_of_elements": int(payload.get("number_of_elements", 5)),
#         "timestamp_offset_end": int(payload.get("timestamp_offset_end", 0)),
#         "timestamp_offset_start": int(payload.get("timestamp_offset_start", 4000))
#     }

#     # Construct destination URL pointing directly to the target Kerberos agent
#     kerberos_url = f"http://{agent_ip}:{agent_port}/api/latest-events"
    
#     try:
#         response = requests.post(kerberos_url, json=agent_payload, timeout=6)
#         response.raise_for_status()
#         return jsonify(response.json())
        
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": f"Failed to reach Kerberos Agent: {str(e)}"}), 500