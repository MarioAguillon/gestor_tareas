-- Script para inicializar la Base de Datos "tareas_db" en Workbench o Railway.

CREATE DATABASE IF NOT EXISTS tareas_db;
USE tareas_db;

-- Tabla de Administradores
CREATE TABLE IF NOT EXISTS administradores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios (Para la nueva gestión de Usuarios Javeriana)
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tareas (Con FK referenciando a Usuarios en Cascada)
CREATE TABLE IF NOT EXISTS tareas (
  id VARCHAR(50) PRIMARY KEY,
  idUsuario VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  resumen TEXT,
  expira DATE,
  completada TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_tareas_usuario
    FOREIGN KEY (idUsuario) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- Insertar Datos Fake iniciales (Los 8 usuarios)
INSERT IGNORE INTO usuarios (id, nombre, avatar) VALUES
    ('u1', 'Andrés Guardia',   'avatar1.jpg'),
    ('u2', 'David Gil',        'avatar2.jpg'),
    ('u3', 'Diego Sanchez',    'avatar3.jpg'),
    ('u4', 'Mario Aguillón',   'avatar4.jpg'),
    ('u5', 'Mischael Pulido',  'avatar5.jpg'),
    ('u6', 'Laura Martínez',   'avatar6.jpg'),
    ('u7', 'Carlos Pérez',     'avatar7.jpg'),
    ('u8', 'Valentina Ríos',   'avatar8.jpg');

-- Usuario Admin por defecto: password -> 'admin123'
-- Hash bcrypt 10 rounds para 'admin123'
INSERT IGNORE INTO administradores (nombre_usuario, password_hash)
VALUES ('admin', '$2a$10$Q7w5sQ8w...');
