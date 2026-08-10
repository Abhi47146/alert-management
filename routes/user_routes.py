from flask import Blueprint, request, jsonify
from db import db
import hashlib
import secrets
from flask_mail import Message

user_bp = Blueprint('user_bp', __name__)

# Create User
@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    hashed_password = hashlib.sha256(data["password"].encode()).hexdigest()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO users
        (name, email, password_hash, role_id, created_by)
        VALUES
        (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            data["name"],
            data["email"],
            hashed_password,
            data.get("role_id"),
            data.get("created_by")
        )
    )

    row = cursor.fetchone()
    if row:
        user_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500
    db.commit()

    return jsonify({
        "message": "User created successfully",
        "id": str(user_id)
    })


# Get All Users
@user_bp.route('/users', methods=['GET'])
def get_users():
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT
            u.id, u.name, u.email, u.role_id,
            r.name AS role_name, u.is_active,
            u.created_at, u.last_login_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
        """
    )
    users = cursor.fetchall()
    return jsonify(users)


# Get all Active users
@user_bp.route('/users/active', methods=['GET'])
def get_active_users():
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            SELECT
                u.id, u.name, u.email, u.role_id,
                r.name AS role_name, u.is_active,
                u.created_at, u.last_login_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.is_active = TRUE
            ORDER BY u.created_at DESC
            """
        )
        active_users = cursor.fetchall()
        return jsonify(active_users)
    except Exception as e:
        print(f"Error fetching active users: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()


# Get User By ID
@user_bp.route('/users/<string:user_id>', methods=['GET'])
def get_user(user_id):
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT
            u.id, u.name, u.email, u.role_id,
            r.name AS role_name, u.is_active,
            u.created_at, u.last_login_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id=%s
        """,
        (user_id,)
    )
    user = cursor.fetchone()
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(user)


# Update User
@user_bp.route('/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE users
        SET name=%s, email=%s, role_id=%s, is_active=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data["email"],
            data["role_id"],
            data.get("is_active", True),
            user_id
        )
    )
    db.commit()
    return jsonify({"message": "User updated successfully"})


# Update Password (via Admin Panel)
@user_bp.route('/users/<string:user_id>/password', methods=['PUT'])
def update_password(user_id):
    data = request.json
    hashed_password = hashlib.sha256(data["password"].encode()).hexdigest()
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE users
        SET password_hash=%s
        WHERE id=%s
        """,
        (hashed_password, user_id)
    )
    db.commit()
    return jsonify({"message": "Password updated successfully"})


# Delete User
@user_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    cursor = db.cursor()
    cursor.execute(
        """
        UPDATE users
        SET is_active = FALSE
        WHERE id=%s
        """,
        (user_id,)
    )
    db.commit()
    return jsonify({"message": "User deactivated successfully"})


# Login API
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    hashed_password = hashlib.sha256(data["password"].encode()).hexdigest()
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT u.id, u.name, u.email, u.role_id, r.name AS role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email=%s AND u.password_hash=%s AND u.is_active = TRUE
        """,
        (data["email"], hashed_password)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "Invalid Credentials"}), 401

    cursor.execute(
        """
        UPDATE users
        SET last_login_at = NOW()
        WHERE id=%s
        """,
        (user["id"],)
    )
    db.commit()
    return jsonify(user)


# Forgot Password Route
@user_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    cursor = db.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = %s AND is_active = TRUE", (email,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({"success": False, "message": "No account associated with this email"}), 404

    # 1. Generate token and links
    token = secrets.token_urlsafe(32)
    reset_link = f"http://localhost:5000/reset-password/{token}"
    
    cursor.execute(
        "UPDATE users SET reset_token = %s WHERE id = %s",
        (token, user["id"])
    )
    db.commit()

    from app_api import mail 

    # 2. Build and send email
    try:
        msg = Message(
            subject="DRISHYAM - Password Reset Request",
            recipients=[email],
            body=f"Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
        )
        mail.send(msg)
        
        return jsonify({
            "success": True,
            "message": "Password reset link sent to your email"
        })
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        return jsonify({"success": False, "message": "Failed to send email"}), 500


# Reset Password Route
@user_bp.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    data = request.get_json()
    new_password = data.get("password")

    if not new_password:
        return jsonify({"success": False, "message": "Password is required"}), 400

    hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
    cursor = db.cursor()

    try:
        cursor.execute(
            """
            UPDATE users 
            SET password_hash = %s, reset_token = NULL 
            WHERE reset_token = %s 
            RETURNING id;
            """,
            (hashed_password, token)
        )
        
        updated_user = cursor.fetchone()
        db.commit()

        if not updated_user:
            return jsonify({"success": False, "message": "The reset token is invalid or has expired."}), 400

        return jsonify({
            "success": True,
            "message": "Your password has been reset successfully"
        }), 200
        
    except Exception as e:
        print(f"Database error during password reset execution: {e}")
        return jsonify({"success": False, "message": "An unexpected server error occurred"}), 500