from flask import Blueprint, request, jsonify
from db import db

role_bp = Blueprint('role_bp', __name__)

# Create Role
@role_bp.route('/roles', methods=['POST'])
def create_role():

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO roles
        (
            name,
            description,
            is_system_role
        )
        VALUES
        (
            %s,%s,%s
        )
        RETURNING id
        """,
        (
            data["name"],
            data.get("description"),
            data.get("is_system_role", False)
        )
    )
    
    row = cursor.fetchone()
    if row:
        role_id = row['id']
    else:
        return {"error": "Database did not return a UUID"}, 500

    db.commit()

    return jsonify({"message": "Role created successfully","id": str(role_id)})


# Get All Roles
@role_bp.route('/roles', methods=['GET'])
def get_roles():

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            description,
            is_system_role,
            created_at
        FROM roles
        ORDER BY name
        """
    )

    roles = cursor.fetchall()

    return jsonify(roles)


# Get Role By ID
@role_bp.route('/roles/<string:role_id>', methods=['GET'])
def get_role(role_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            description,
            is_system_role,
            created_at
        FROM roles
        WHERE id=%s
        """,
        (role_id,)
    )

    role = cursor.fetchone()

    if not role:
        return jsonify({"message": "Role not found"}), 404

    return jsonify(role)


# Update Role
@role_bp.route('/roles/<string:role_id>', methods=['PUT'])
def update_role(role_id):

    data = request.json
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE roles
        SET
            name=%s,
            description=%s,
            is_system_role=%s
        WHERE id=%s
        """,
        (
            data["name"],
            data.get("description"),
            data.get("is_system_role", False),
            role_id
        )
    )

    db.commit()

    return jsonify({
        "message": "Role updated successfully"
    })


# Delete Role
@role_bp.route('/roles/<string:role_id>', methods=['DELETE'])
def delete_role(role_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT is_system_role
        FROM roles
        WHERE id=%s
        """,
        (role_id,)
    )

    role = cursor.fetchone()

    if not role:
        return jsonify({"message": "Role not found"}), 404

    if role["is_system_role"]:
        return jsonify({"message": "System roles cannot be deleted"}), 400

    cursor.execute(
        """
        DELETE FROM roles
        WHERE id=%s
        """,
        (role_id,)
    )

    db.commit()

    return jsonify({
        "message": "Role deleted successfully"
    })


# Get Users By Role
@role_bp.route('/roles/<string:role_id>/users', methods=['GET'])
def get_users_by_role(role_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            id,
            name,
            email,
            is_active,
            created_at
        FROM users
        WHERE role_id=%s
        ORDER BY name
        """,
        (role_id,)
    )

    users = cursor.fetchall()

    return jsonify(users)