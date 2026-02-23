-- =====================================================
-- DATABASE: ABSENSI
-- =====================================================
DROP DATABASE IF EXISTS ABSENSI;
CREATE DATABASE ABSENSI;
USE ABSENSI;

-- =====================================================
-- OFFICES
-- =====================================================
CREATE TABLE offices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    office_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meter INT DEFAULT 100,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DIVISIONS
-- =====================================================
CREATE TABLE divisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    divisions_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    office_id INT,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (office_id) REFERENCES offices(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roles_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERMISSIONS
-- =====================================================
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permissions_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROLES HAS PERMISSION
-- =====================================================
CREATE TABLE roles_has_permission (
    id_roles INT NOT NULL,
    divisions_id INT NOT NULL,
    id_permissions INT NOT NULL,
    PRIMARY KEY (id_roles, divisions_id, id_permissions),
    FOREIGN KEY (id_roles) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (divisions_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (id_permissions) REFERENCES permissions(id) ON DELETE CASCADE
);

-- =====================================================
-- USERS HAS ROLES
-- =====================================================
CREATE TABLE users_has_roles (
    id_users INT NOT NULL,
    id_roles INT NOT NULL,
    divisions_id INT NOT NULL,
    PRIMARY KEY (id_users, id_roles, divisions_id),
    FOREIGN KEY (id_users) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_roles) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (divisions_id) REFERENCES divisions(id) ON DELETE CASCADE
);

-- =====================================================
-- SHIFTS
-- =====================================================
CREATE TABLE shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME NOT NULL,
    late_tolerance_minute INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER SHIFTS (JADWAL USER)
-- =====================================================
CREATE TABLE user_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shift_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- ATTENDANCES
-- =====================================================
CREATE TABLE attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    office_id INT NOT NULL,

    check_in DATETIME NULL,
    check_out DATETIME NULL,

    check_in_lat DECIMAL(10,8),
    check_in_long DECIMAL(11,8),
    check_in_foto VARCHAR(255) DEFAULT NULL,

    check_out_lat DECIMAL(10,8),
    check_out_long DECIMAL(11,8),
    check_out_foto VARCHAR(255) DEFAULT NULL,

    status ENUM(
        'present',
        'late',
        'early_leave',
        'absent',
        'permission',
        'sick',
        'leave'
    ) DEFAULT 'present',

    work_duration INT NULL, -- menit
    overtime_minute INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (office_id) REFERENCES offices(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- LEAVES / IZIN / CUTI
-- =====================================================
CREATE TABLE leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type ENUM('sick','annual','permission') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- HOLIDAYS
-- =====================================================
CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    holiday_name VARCHAR(150),
    holiday_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ATTENDANCES TRANSUM (Transportasi Umum)
-- =====================================================
CREATE TABLE attendances_transum (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    check_in DATETIME NULL,
    check_in_lat DECIMAL(10,8),
    check_in_long DECIMAL(11,8),
    check_in_photo VARCHAR(255),

    check_out DATETIME NULL,
    check_out_lat DECIMAL(10,8),
    check_out_long DECIMAL(11,8),
    check_out_photo VARCHAR(255),

    type_transum ENUM(
        'LRT',
        'LRT Jakarta',
        'MRT',
        'Transjakarta',
        'Jaklingko'
    ) NOT NULL,

    city ENUM(
        'Jakarta Pusat',
        'Jakarta Timur',
        'Jakarta Utara',
        'Jakarta Barat',
        'Jakarta Selatan',
        'Bekasi',
        'Tangerang Selatan',
        'Tangerang',
        'Depok',
        'Bogor'
    ) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Office
INSERT INTO offices (id, office_name, latitude, longitude, radius_meter, address)
VALUES (1, 'Head Office', -6.20000000, 106.81666600, 100, 'Jakarta');

-- Division
INSERT INTO divisions (id, divisions_name)
VALUES (1, 'general_office');

-- Roles
INSERT INTO roles (id, roles_name) VALUES
(1, 'super_admin'),
(2, 'ceo'),
(3, 'co_ceo'),
(4, 'cto'),
(5, 'co_cto'),
(6, 'supervisor'),
(7, 'manager'),
(8, 'staf');

-- Permissions
INSERT INTO permissions (id, permissions_name) VALUES
(1, 'manage_user'),
(2, 'manage_user_add'),
(3, 'manage_user_edit'),
(4, 'manage_user_delete'),
(5, 'manage_user_update');

-- Roles Has Permission
INSERT INTO roles_has_permission (id_roles, divisions_id, id_permissions) VALUES
(1, 1, 1),
(1, 1, 2),
(1, 1, 3),
(1, 1, 4),
(1, 1, 5);

-- User (admin@company.com / 12345678)
INSERT INTO users (id, office_id, name, email, password)
VALUES (
    1,
    1,
    'Super Admin',
    'admin@company.com',
    '$argon2id$v=19$m=65536,t=3,p=4$aKmtnPx5tghdtrMuNWDePQ$aBlQtMo+wdtvA6DxVK1gEaWnKN4iSJGOMWosTTmYoyI'
);

-- Users Has Roles
INSERT INTO users_has_roles (id_users, id_roles, divisions_id)
VALUES (1, 1, 1);

-- Shift
INSERT INTO shifts (id, shift_name, check_in, check_out, late_tolerance_minute)
VALUES (1, 'Regular Shift', '08:00:00', '17:00:00', 10);

-- Assign shift ke user
INSERT INTO user_shifts (user_id, shift_id, start_date)
VALUES (1, 1, CURDATE());

-- Holiday example
INSERT INTO holidays (holiday_name, holiday_date)
VALUES ('New Year', '2026-01-01');
