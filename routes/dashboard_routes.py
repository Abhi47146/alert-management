from flask import Blueprint, jsonify

from db import db

dashboard_bp = Blueprint("dashboard_bp", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    cursor = db.cursor()

    try:
        # 1. Combined Camera Stats with explicit dictionary names (AS ...)
        cursor.execute("""
            SELECT 
                COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN is_process = TRUE THEN 1 ELSE 0 END), 0) AS active,
                COALESCE(SUM(CASE WHEN is_process = FALSE THEN 1 ELSE 0 END), 0) AS inactive,
                COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS online,
                COALESCE(SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END), 0) AS offline
            FROM cameras;
        """)
        
        camera_row = cursor.fetchone()
        
        # 2. Get Alerts from last hour with explicit dictionary name
        cursor.execute("""
            SELECT COUNT(*) AS alerts_count
            FROM alerts
            WHERE created_at >= NOW() - INTERVAL '1 hour';
        """)
        
        alert_row = cursor.fetchone()

        # Build final response using the string keys from the dictionary
        return jsonify({
            "total_cameras": int(camera_row["total"]) if camera_row else 0,
            "active_cameras": int(camera_row["active"]) if camera_row else 0,
            "inactive_cameras": int(camera_row["inactive"]) if camera_row else 0,
            "online_cameras": int(camera_row["online"]) if camera_row else 0,
            "offline_cameras": int(camera_row["offline"]) if camera_row else 0,
            "alerts_last_hour": int(alert_row["alerts_count"]) if alert_row else 0
        })

    except Exception as e:
        print("--- POSTGRESQL ERROR ---")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()