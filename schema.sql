CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE camera_status AS ENUM (
    'active',
    'inactive',
    'offline'
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    reset_token TEXT UNIQUE,
    role_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID,

    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id)
        REFERENCES roles(id),

    FOREIGN KEY (permission_id)
        REFERENCES permissions(id),

    FOREIGN KEY (granted_by)
        REFERENCES users(id)
);

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    address TEXT,
    email VARCHAR(255) DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (created_by)
        REFERENCES users(id)
);

CREATE TABLE site_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    is_primary BOOLEAN DEFAULT FALSE,
    added_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (site_id)
        REFERENCES sites(id),

    FOREIGN KEY (added_by)
        REFERENCES users(id)
);

CREATE TABLE alert_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE license_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_number INTEGER UNIQUE,
    assigned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_scn VARCHAR(150) NOT NULL,
    name VARCHAR(150) NOT NULL,
    site_id UUID NOT NULL,
    alert_type_id UUID,
    stream_url TEXT,
    ip_address INET,
    username VARCHAR(100),
    password_encrypted TEXT,
    status camera_status DEFAULT 'active',
    is_licensed BOOLEAN DEFAULT FALSE,
    license_slot_id UUID,
    registered_by UUID,
    deregistered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    monitoring_start_time TEXT DEFAULT NULL,
    monitoring_end_time TEXT DEFAULT NULL,
    
    is_process BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (site_id)
        REFERENCES sites(id),

    FOREIGN KEY (alert_type_id)
        REFERENCES alert_types(id),

    FOREIGN KEY (license_slot_id)
        REFERENCES license_slots(id),

    FOREIGN KEY (registered_by)
        REFERENCES users(id)
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_scn VARCHAR(150) NOT NULL,
    camera_name VARCHAR(150) NOT NULL,
    site_name VARCHAR(150) NOT NULL,
    alert_type_name VARCHAR(150) NOT NULL,
    image_url TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);
