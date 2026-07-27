#!/usr/bin/env python3
"""
DRISHYAM Surveillance Command Center - Python Flask Server
This server builds and serves the complete React application locally.
Run with: python3 app.py
"""

import os
import sys
import subprocess
from pathlib import Path
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import requests

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.absolute()
BUILD_DIR = BASE_DIR / "dist" / "spa"
CLIENT_DIR = BASE_DIR / "client"
DB_API_SERVER = "http://0.0.0.0:8000" 

app = Flask(__name__, static_folder=str(BUILD_DIR), static_url_path="")
CORS(app)

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(message):
    """Print a formatted header message"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(message):
    """Print a success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_info(message):
    """Print an info message"""
    print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")

def print_error(message):
    """Print an error message"""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def build_react_app():
    """Build the React application"""
    print_header("Building React Application")
    
    if not (BASE_DIR / "package.json").exists():
        print_error("package.json not found. Are you in the correct directory?")
        sys.exit(1)
    
    print_info("Running: pnpm build")
    try:
        result = subprocess.run(
            ["pnpm", "build"],
            cwd=str(BASE_DIR),
            capture_output=False
        )
        if result.returncode != 0:
            print_error("Build failed!")
            sys.exit(1)
        print_success("React app built successfully!")
    except FileNotFoundError:
        print_error("pnpm not found. Please install pnpm first:")
        print_error("  npm install -g pnpm")
        sys.exit(1)

def check_build_exists():
    """Check if the build directory exists"""
    if BUILD_DIR.exists() and any(BUILD_DIR.iterdir()):
        print_success(f"Using existing build from: {BUILD_DIR}")
        return True
    return False

@app.route("/api/health")
def health_check():
    """API endpoint for health check"""
    return jsonify({
        "status": "healthy",
        "app": "DRISHYAM Surveillance Command Center",
        "version": "1.0.0"
    })

@app.route("/api/config")
def config():
    """API endpoint for app configuration"""
    return jsonify({
        "app_name": "DRISHYAM",
        "app_title": "Surveillance Command Center",
        "version": "1.0.0",
        "environment": "production"
    })

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_app(path):
    """Serve the React SPA - handle all routes"""
    # Try to serve the requested file if it exists (for assets)
    if path and (BUILD_DIR / path).exists():
        return send_from_directory(BUILD_DIR, path)
    
    # For all other routes, serve index.html (React Router will handle routing)
    if (BUILD_DIR / "index.html").exists():
        return send_from_directory(BUILD_DIR, "index.html")
    
    return jsonify({
        "error": "Application not built",
        "message": "Please run 'python3 app.py' to build the application first"
    }), 404

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors by serving the React app"""
    if (BUILD_DIR / "index.html").exists():
        return send_from_directory(BUILD_DIR, "index.html")
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route("/static/alerts/<path:filename>")
def serve_alert_images(filename):

    local_static_dir = os.path.join(BASE_DIR, "static", "alerts")
    if os.path.exists(os.path.join(local_static_dir, filename)):
        return send_from_directory(local_static_dir, filename)
    
    
    try:
        response = requests.get(f"{DB_API_SERVER}/static/alerts/{filename}")
        return (response.content, response.status_code, response.headers.items())
    except Exception as e:
        return jsonify({"error": "Could not retrieve image from backend storage", "details": str(e)}), 404

@app.route("/api/<path:api_path>", methods=["GET", "POST", "PUT", "DELETE"])
def proxy_to_database_api(api_path):
    
    url = f"{DB_API_SERVER}/api/{api_path}"
    
    from flask import request as flask_req
    try:
        response = requests.request(
            method=flask_req.method,
            url=url,
            headers={key: value for key, value in flask_req.headers if key != 'Host'},
            data=flask_req.get_data(),
            cookies=flask_req.cookies,
            allow_redirects=False
        )
        return (response.content, response.status_code, response.headers.items())
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Database API server is not running on port 8000"}), 502


def main():
    """Main entry point"""
    print_info("Starting Python Flask Server\n")
    
    # Check if build exists, if not, build it
    if not check_build_exists():
        build_react_app()
    
    # Start the Flask server
    print_header("Starting Server")
    print_info("DRISHYAM will be available at:")
    print(f"\n{Colors.BOLD}{Colors.GREEN}  http://localhost:5000{Colors.RESET}\n")
    print_info("Press Ctrl+C to stop the server\n")
    
    # Run the Flask app
    try:
        app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Server stopped.{Colors.RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
