-- ==========================================
-- SISTEMA DE GESTIÓN DE TAREAS - ESQUEMA DE BASE DE DATOS
-- ==========================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS tareas_estudiantes CASCADE;
DROP TABLE IF EXISTS estudiantes_materias CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;

-- ==========================================
-- TABLA: ESTUDIANTES
-- ==========================================
CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    carrera VARCHAR(100),
    semestre VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: MATERIAS
-- ==========================================
CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(10) DEFAULT '📚',
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: TAREAS
-- ==========================================
CREATE TABLE tareas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    materia_id INTEGER REFERENCES materias(id),
    prioridad VARCHAR(20) CHECK (prioridad IN ('baja', 'media', 'alta')) DEFAULT 'media',
    fecha_vencimiento DATE NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: ESTUDIANTES_MATERIAS (Relación muchos a muchos)
-- ==========================================
CREATE TABLE estudiantes_materias (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    materia_id INTEGER REFERENCES materias(id),
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, materia_id)
);

-- ==========================================
-- TABLA: TAREAS_ESTUDIANTES (Relación muchos a muchos)
-- ==========================================
CREATE TABLE tareas_estudiantes (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    tarea_id INTEGER REFERENCES tareas(id),
    completada BOOLEAN DEFAULT FALSE,
    fecha_completada TIMESTAMP NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudiante_id, tarea_id)
);

-- ==========================================
-- DATOS INICIALES - TUS 5 MATERIAS REALES
-- ==========================================
INSERT INTO materias (nombre, descripcion, icono) VALUES
('Base de Datos Geografica', 'Sistemas de información geográfica y bases de datos espaciales', '🗺️'),
('Soporte tecnico en redes', 'Mantenimiento y soporte de infraestructura de red', '🔧'),
('Administracion de Servidores', 'Gestión y administración de servidores y servicios', '🖥️'),
('Programación Backend Web', 'Desarrollo de servidores, APIs y lógica del servidor', '⚙️'),
('Programación Frontend Web', 'Desarrollo de interfaces de usuario web y experiencia de usuario', '🎨');

-- ==========================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ==========================================
CREATE INDEX idx_estudiantes_email ON estudiantes(email);
CREATE INDEX idx_tareas_materia_id ON tareas(materia_id);
CREATE INDEX idx_tareas_fecha_vencimiento ON tareas(fecha_vencimiento);
CREATE INDEX idx_estudiantes_materias_estudiante ON estudiantes_materias(estudiante_id);
CREATE INDEX idx_estudiantes_materias_materia ON estudiantes_materias(materia_id);
CREATE INDEX idx_tareas_estudiantes_estudiante ON tareas_estudiantes(estudiante_id);
CREATE INDEX idx_tareas_estudiantes_tarea ON tareas_estudiantes(tarea_id);
CREATE INDEX idx_tareas_estudiantes_completada ON tareas_estudiantes(completada);

-- ==========================================
-- MENSAJE DE CONFIRMACIÓN
-- ==========================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Esquema de base de datos creado exitosamente';
    RAISE NOTICE '📊 Tablas creadas: estudiantes, materias, tareas, estudiantes_materias, tareas_estudiantes';
    RAISE NOTICE '📚 Materias insertadas: 5 materias reales del sistema';
END $$;