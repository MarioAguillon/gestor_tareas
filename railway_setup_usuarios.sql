-- =============================================
-- SCRIPT PARA RAILWAY — Tabla Usuarios
-- Base de datos: railway (ya existente en Railway)
-- =============================================
-- NOTA: En Railway NO se usa USE ni CREATE DATABASE.
--       Railway ya asigna la base automáticamente.
--       Ejecutar directamente en la pestaña "Data" > "Query"
-- =============================================

-- PASO 1: Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'avatar1.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PASO 2: Insertar los 8 usuarios del proyecto Javeriana
-- INSERT IGNORE evita errores si ya existen
INSERT IGNORE INTO usuarios (id, nombre, avatar) VALUES
    ('u1', 'Andrés Guardia',   'avatar1.jpg'),
    ('u2', 'David Gil',        'avatar2.jpg'),
    ('u3', 'Diego Sanchez',    'avatar3.jpg'),
    ('u4', 'Mario Aguillón',   'avatar4.jpg'),
    ('u5', 'Mischael Pulido',  'avatar5.jpg'),
    ('u6', 'Laura Martínez',   'avatar6.jpg'),
    ('u7', 'Carlos Pérez',     'avatar7.jpg'),
    ('u8', 'Valentina Ríos',   'avatar8.jpg');

-- PASO 3: Agregar Foreign Key en tareas → usuarios (ON DELETE CASCADE)
-- Primero eliminamos la FK si ya existe para evitar error de duplicado
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'fk_tarea_usuario'
      AND TABLE_NAME = 'tareas'
      AND TABLE_SCHEMA = DATABASE()
);

-- Si la FK no existe, la creamos
-- (Railway no soporta IF en ALTER, así que usamos procedure temporal)
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_fk_if_not_exists()
BEGIN
    DECLARE fk_count INT;
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'fk_tarea_usuario'
      AND TABLE_NAME = 'tareas'
      AND TABLE_SCHEMA = DATABASE();

    IF fk_count = 0 THEN
        ALTER TABLE tareas
            ADD CONSTRAINT fk_tarea_usuario
            FOREIGN KEY (idUsuario) REFERENCES usuarios(id)
            ON DELETE CASCADE;
    END IF;
END$$
DELIMITER ;

CALL add_fk_if_not_exists();
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

-- PASO 4: Índice de rendimiento para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_idUsuario ON tareas(idUsuario);

-- =============================================
-- VERIFICACIÓN
-- =============================================
SHOW TABLES;
SELECT * FROM usuarios;
DESCRIBE tareas;
