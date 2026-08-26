from flask import Blueprint, jsonify
from db import db

dashboard_bp = Blueprint("dashboard_bp", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    cursor = db.cursor()

    try:
        # Case-insensitive pattern matching on sites.name
        cursor.execute("""
            SELECT 
                COUNT(c.id) AS total_cameras,

                -- RTSP / Non-Solar Site Cameras (Site name does NOT contain 'solar')
                COALESCE(SUM(CASE WHEN s.name NOT ILIKE '%solar%' OR s.name IS NULL THEN 1 ELSE 0 END), 0) AS total_rtsp,
                COALESCE(SUM(CASE WHEN (s.name NOT ILIKE '%solar%' OR s.name IS NULL) AND c.is_process = TRUE THEN 1 ELSE 0 END), 0) AS active_rtsp,
                COALESCE(SUM(CASE WHEN (s.name NOT ILIKE '%solar%' OR s.name IS NULL) AND c.is_process = FALSE THEN 1 ELSE 0 END), 0) AS inactive_rtsp,
                COALESCE(SUM(CASE WHEN (s.name NOT ILIKE '%solar%' OR s.name IS NULL) AND c.status = 'active' THEN 1 ELSE 0 END), 0) AS online_rtsp,
                COALESCE(SUM(CASE WHEN (s.name NOT ILIKE '%solar%' OR s.name IS NULL) AND c.status = 'inactive' THEN 1 ELSE 0 END), 0) AS offline_rtsp,

                -- Solar Site Cameras (Site name contains 'solar')
                COALESCE(SUM(CASE WHEN s.name ILIKE '%solar%' THEN 1 ELSE 0 END), 0) AS total_solar,
                COALESCE(SUM(CASE WHEN s.name ILIKE '%solar%' AND c.is_process = TRUE THEN 1 ELSE 0 END), 0) AS active_solar,
                COALESCE(SUM(CASE WHEN s.name ILIKE '%solar%' AND c.is_process = FALSE THEN 1 ELSE 0 END), 0) AS inactive_solar,
                COALESCE(SUM(CASE WHEN s.name ILIKE '%solar%' AND c.status = 'active' THEN 1 ELSE 0 END), 0) AS online_solar,
                COALESCE(SUM(CASE WHEN s.name ILIKE '%solar%' AND c.status = 'inactive' THEN 1 ELSE 0 END), 0) AS offline_solar

            FROM cameras c
            LEFT JOIN sites s ON c.site_id = s.id;
        """)
        
        row = cursor.fetchone()
        
        # Alerts count from last hour
        cursor.execute("""
            SELECT COUNT(*) AS alerts_count
            FROM alerts
            WHERE created_at >= NOW() - INTERVAL '1 hour';
        """)
        
        alert_row = cursor.fetchone()

        return jsonify({
            "total_cameras": int(row["total_cameras"]) if row else 0,
            
            # RTSP Metrics
            "total_rtsp_cameras": int(row["total_rtsp"]) if row else 0,
            "active_rtsp_cameras": int(row["active_rtsp"]) if row else 0,
            "inactive_rtsp_cameras": int(row["inactive_rtsp"]) if row else 0,
            "online_rtsp_cameras": int(row["online_rtsp"]) if row else 0,
            "offline_rtsp_cameras": int(row["offline_rtsp"]) if row else 0,
            
            # Solar Metrics
            "total_solar_cameras": int(row["total_solar"]) if row else 0,
            "active_solar_cameras": int(row["active_solar"]) if row else 0,
            "inactive_solar_cameras": int(row["inactive_solar"]) if row else 0,
            "online_solar_cameras": int(row["online_solar"]) if row else 0,
            "offline_solar_cameras": int(row["offline_solar"]) if row else 0,
            
            "alerts_last_hour": int(alert_row["alerts_count"]) if alert_row else 0
        })

    except Exception as e:
        print("--- POSTGRESQL ERROR ---")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()