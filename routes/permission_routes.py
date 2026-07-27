from flask import Blueprint, request, jsonify
from db import db

permission_bp = Blueprint("permission_bp", __name__)

# Create Permission
@permission_bp.route("/permissions", methods=["POST"])
def create_permission():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO permissions
        (
            action,
            module,
            description
        )
        VALUES
        (
            %s,%s,%s
        )
        RETURNING id
        """,
        (
            data["action"],
            data["module"],
            data.get("description")
        )
    )

    permission_id = cursor.fetchone()[0]

    db.commit()

    return jsonify({
        "message": "Permission created successfully",
        "id": str(permission_id)
    })

# Get All Permissions
@permission_bp.route("/permissions", methods=["GET"])
def get_permissions():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            action,
            module,
            description
        FROM permissions
        ORDER BY module, action
        """
    )

    permissions = cursor.fetchall()

    return jsonify(permissions)

# Get Permission by ID
@permission_bp.route("/permissions/<string:permission_id>", methods=["GET"])
def get_permission(permission_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            action,
            module,
            description
        FROM permissions
        WHERE id=%s
        """,
        (permission_id,)
    )

    permission = cursor.fetchone()

    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    return jsonify(permission)

# Update Permission
@permission_bp.route("/permissions/<string:permission_id>", methods=["PUT"])
def update_permission(permission_id):

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE permissions
        SET
            action=%s,
            module=%s,
            description=%s
        WHERE id=%s
        """,
        (
            data["action"],
            data["module"],
            data.get("description"),
            permission_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Permission updated successfully"
    })

# Delete Permission
@permission_bp.route("/permissions/<string:permission_id>", methods=["DELETE"])
def delete_permission(permission_id):

    cursor = db.cursor()

    cursor.execute(
        """
        DELETE FROM permissions
        WHERE id=%s
        """,
        (permission_id,)
    )

    db.commit()

    return jsonify({
        "message": "Permission deleted successfully"
    })

# Assign Permission To Role
@permission_bp.route("/roles/<string:role_id>/permissions", methods=["POST"])
def assign_permission(role_id):

    data = request.json

    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO role_permissions
        (
            role_id,
            permission_id,
            granted_by
        )
        VALUES
        (
            %s,%s,%s
        )
        """,
        (
            role_id,
            data["permission_id"],
            data.get("granted_by")
        )
    )

    db.commit()

    return jsonify({
        "message": "Permission assigned successfully"
    })

# Get Permissions For Role
@permission_bp.route("/roles/<string:role_id>/permissions", methods=["GET"])
def get_role_permissions(role_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            p.id,
            p.action,
            p.module,
            p.description
        FROM role_permissions rp
        JOIN permissions p
            ON rp.permission_id = p.id
        WHERE rp.role_id=%s
        ORDER BY p.module, p.action
        """,
        (role_id,)
    )

    permissions = cursor.fetchall()

    return jsonify(permissions)

# Remove Permission From Role
@permission_bp.route("/roles/<string:role_id>/permissions/<string:permission_id>",methods=["DELETE"])
def remove_permission(role_id, permission_id):

    cursor = db.cursor()

    cursor.execute(
        """
        DELETE FROM role_permissions
        WHERE role_id=%s
        AND permission_id=%s
        """,
        (
            role_id,
            permission_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Permission removed successfully"
    })