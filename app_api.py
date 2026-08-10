from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from routes.user_routes import user_bp
from routes.role_routes import role_bp
from routes.permission_routes import permission_bp
from routes.site_routes import site_bp
from routes.site_recipient_routes import site_recipient_bp
from routes.alert_type_routes import alert_type_bp
from routes.license_slots_routes import license_slot_bp
from routes.camera_routes import camera_bp
from routes.alert_routes import alert_bp
from routes.dashboard_routes import dashboard_bp
from routes.system_health_routes import health_bp
from routes.kerberos_recording_routes import recording_bp
from routes.kerberos_agent_routes import kerberos_bp


app = Flask(__name__)
CORS(app)

# Email Configurations
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'abhishek.kumar@itspe.co.in'
# Note: For Gmail, this must be an "App Password", not your normal password!
app.config['MAIL_PASSWORD'] = 'yznc lhvh ubyi neod' 
app.config['MAIL_DEFAULT_SENDER'] = 'abhishek.kumar@itspe.co.in'

mail = Mail(app)

app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(role_bp, url_prefix="/api")
app.register_blueprint(permission_bp, url_prefix="/api")
app.register_blueprint(site_bp, url_prefix="/api")
app.register_blueprint(site_recipient_bp, url_prefix="/api")
app.register_blueprint(alert_type_bp, url_prefix="/api")
app.register_blueprint(license_slot_bp, url_prefix="/api")
app.register_blueprint(camera_bp, url_prefix="/api")
app.register_blueprint(alert_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(recording_bp, url_prefix="/api")
app.register_blueprint(kerberos_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)