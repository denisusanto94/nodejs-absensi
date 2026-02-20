-- Create Database
CREATE DATABASE IF NOT EXISTS `absensi-amazfit`;
USE `absensi-amazfit`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE, 
  `password` VARCHAR(255) NOT NULL, 
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'employee') DEFAULT 'employee',
  `shift_start` TIME DEFAULT '09:00:00',
  `shift_end` TIME DEFAULT '17:00:00',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Office Locations Table
CREATE TABLE IF NOT EXISTS `office_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `radius` INT DEFAULT 100, 
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('check_in', 'check_out') NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `status` ENUM('valid', 'invalid', 'late') DEFAULT 'valid',
  `device_info` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Seed Data
-- User: 12345 (password: 12345)
INSERT INTO `users` (`username`, `password`, `name`, `role`, `shift_start`, `shift_end`) VALUES
('12345', '$2b$10$a.VzKi5xYezcnVFk/0eQfunX8yII2MHM7jn9FyGFBNA6JN1hlmrdC', 'Deni', 'employee', '08:00:00', '17:00:00');

-- User: admin (password: password)
INSERT INTO `users` (`username`, `password`, `name`, `role`, `shift_start`, `shift_end`) VALUES
('admin', '$2b$10$bL0JIebKYykRKK71Ip6SL.2mSK4ri.GUkFqWm3N9QPnD8tBSinYbm', 'Admin User', 'admin', '09:00:00', '18:00:00');

-- Insert Default Office Location (Monas, Jakarta as example)
INSERT INTO `office_locations` (`name`, `latitude`, `longitude`, `radius`) VALUES
('Head Office (Monas)', -6.175392, 106.827153, 100);
