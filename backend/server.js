const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 1205
    ;
const JWT_SECRET = process.env.JWT_SECRET;  

// Configuración PostgreSQL - USANDO TUS VARIABLES .env
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'frontend',
    password: process.env.DB_PASSWORD || 'esterno99',
    port: process.env.DB_PORT || 1205, // Tu puerto 1205 se usará automáticamente
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('../'));
// Middleware JWT simplificado
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// ==================== RUTAS DE AUTH ====================

// REGISTRO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, email, password, telefono, carrera, semestre } = req.body;

        // Verificar si el email ya existe
        const emailExiste = await pool.query('SELECT id FROM estudiantes WHERE email = $1', [email]);
        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar estudiante
        const result = await pool.query(
            `INSERT INTO estudiantes (nombre, email, telefono, carrera, semestre, password_hash) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, email, carrera, semestre`,
            [nombre, email, telefono, carrera, semestre, passwordHash]
        );

        const estudiante = result.rows[0];

        // Inscribir en todas las materias
        await pool.query(
            `INSERT INTO estudiantes_materias (estudiante_id, materia_id)
             SELECT $1, id FROM materias WHERE activa = TRUE`,
            [estudiante.id]
        );

        // Generar token
        const token = jwt.sign(
            { id: estudiante.id, email: estudiante.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            estudiante
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM estudiantes WHERE email = $1 AND activo = TRUE',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const estudiante = result.rows[0];

        // Verificar password
        const passwordValido = await bcrypt.compare(password, estudiante.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE estudiantes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
            [estudiante.id]
        );

        // Generar token
        const token = jwt.sign(
            { id: estudiante.id, email: estudiante.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            estudiante: {
                id: estudiante.id,
                nombre: estudiante.nombre,
                email: estudiante.email,
                carrera: estudiante.carrera,
                semestre: estudiante.semestre
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ==================== RUTAS PROTEGIDAS ====================

// OBTENER PERFIL
app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, telefono, carrera, semestre FROM estudiantes WHERE id = $1',
            [req.user.id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// ACTUALIZAR PERFIL
app.put('/api/perfil', verificarToken, async (req, res) => {
    try {
        const { nombre, telefono, carrera, semestre } = req.body;
        
        const result = await pool.query(
            `UPDATE estudiantes 
             SET nombre = $1, telefono = $2, carrera = $3, semestre = $4
             WHERE id = $5
             RETURNING id, nombre, email, telefono, carrera, semestre`,
            [nombre, telefono, carrera, semestre, req.user.id]
        );
        
        res.json({
            mensaje: 'Perfil actualizado',
            estudiante: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// OBTENER MATERIAS
app.get('/api/materias', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, COUNT(t.id) as tareas_pendientes
            FROM materias m
            LEFT JOIN tareas t ON m.id = t.materia_id AND t.activa = TRUE 
            AND t.fecha_vencimiento >= CURRENT_DATE
            WHERE m.activa = TRUE
            GROUP BY m.id
            ORDER BY m.nombre
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener materias' });
    }
});

// OBTENER TAREAS DEL ESTUDIANTE
app.get('/api/tareas', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                t.titulo,
                t.descripcion,
                t.fecha_vencimiento,
                t.prioridad,
                m.nombre as clase,
                m.icono,
                te.completada,
                CASE 
                    WHEN t.fecha_vencimiento < CURRENT_DATE THEN TRUE
                    ELSE FALSE
                END as vencida
            FROM tareas_estudiantes te
            JOIN tareas t ON te.tarea_id = t.id
            JOIN materias m ON t.materia_id = m.id
            WHERE te.estudiante_id = $1 AND t.activa = TRUE
            ORDER BY t.fecha_vencimiento ASC
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});



// CREAR NUEVA TAREA
app.post('/api/tareas', verificarToken, async (req, res) => {
    try {
        const { titulo, descripcion, materia_id, prioridad, fecha_vencimiento } = req.body;
        
        console.log('Creando tarea:', { titulo, materia_id, prioridad, fecha_vencimiento });

        // Validar que la materia existe y el estudiante está inscrito
        const materiaCheck = await pool.query(
            `SELECT 1 FROM estudiantes_materias 
             WHERE estudiante_id = $1 AND materia_id = $2`,
            [req.user.id, materia_id]
        );
        
        if (materiaCheck.rows.length === 0) {
            return res.status(400).json({ error: 'No estás inscrito en esta materia' });
        }

        // Insertar nueva tarea
        const result = await pool.query(
            `INSERT INTO tareas (titulo, descripcion, materia_id, prioridad, fecha_vencimiento, activa) 
             VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
            [titulo, descripcion, materia_id, prioridad, fecha_vencimiento]
        );

        const nuevaTarea = result.rows[0];

        // Asignar la tarea a todos los estudiantes de la materia
        await pool.query(
            `INSERT INTO tareas_estudiantes (estudiante_id, tarea_id, completada)
             SELECT em.estudiante_id, $1, FALSE
             FROM estudiantes_materias em
             WHERE em.materia_id = $2`,
            [nuevaTarea.id, materia_id]
        );

        res.status(201).json({
            mensaje: 'Tarea creada exitosamente',
            tarea: nuevaTarea
        });

    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error del servidor al crear tarea' });
    }
});




// MARCAR TAREA COMO COMPLETADA
app.put('/api/tareas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { completada } = req.body;
        
        await pool.query(
            `UPDATE tareas_estudiantes 
             SET completada = $1, fecha_completada = CASE WHEN $1 THEN NOW() ELSE NULL END
             WHERE tarea_id = $2 AND estudiante_id = $3`,
            [completada, id, req.user.id]
        );
        
        res.json({ mensaje: 'Tarea actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// OBTENER ESTADÍSTICAS
app.get('/api/estadisticas', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_tareas,
                COUNT(CASE WHEN te.completada = TRUE THEN 1 END) as completadas,
                COUNT(CASE WHEN te.completada = FALSE THEN 1 END) as pendientes,
                COUNT(CASE WHEN te.completada = FALSE AND t.fecha_vencimiento < CURRENT_DATE THEN 1 END) as vencidas
            FROM tareas_estudiantes te
            JOIN tareas t ON te.tarea_id = t.id
            WHERE te.estudiante_id = $1 AND t.activa = TRUE
        `, [req.user.id]);
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Ruta de verificación de servidor
app.get('/api/health', (req, res) => {
    res.json({ 
        mensaje: '🚀 Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Ruta para verificar conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time, version() as version');
        res.json({
            database: '✅ Conectado a PostgreSQL',
            time: result.rows[0].time,
            version: result.rows[0].version
        });
    } catch (error) {
        res.status(500).json({ 
            error: '❌ Error conectando a la base de datos',
            details: error.message 
        });
    }
});

// Iniciar servidor

// Agrega esta ruta DELETE (antes de app.listen)
app.delete('/api/tareas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // En tu estructura, probablemente quieras desactivar la tarea en lugar de eliminarla
        await pool.query(
            'UPDATE tareas SET activa = FALSE WHERE id = $1',
            [id]
        );
        
        res.json({ mensaje: 'Tarea eliminada' });
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME} en puerto ${process.env.DB_PORT}`);
});




































// ==================== NOTIFICACIONES ====================

// OBTENER NOTIFICACIONES DEL USUARIO
app.get('/api/notificaciones', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                titulo,
                mensaje,
                tipo,
                leida,
                fecha_creacion,
                CASE 
                    WHEN fecha_creacion > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN TRUE
                    ELSE FALSE
                END as reciente
            FROM notificaciones 
            WHERE estudiante_id = $1 
            ORDER BY fecha_creacion DESC
            LIMIT 20
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
});

// MARCAR NOTIFICACIÓN COMO LEÍDA
app.put('/api/notificaciones/:id/leer', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            'UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND estudiante_id = $2',
            [id, req.user.id]
        );
        
        res.json({ mensaje: 'Notificación marcada como leída' });
    } catch (error) {
        console.error('Error actualizando notificación:', error);
        res.status(500).json({ error: 'Error al actualizar notificación' });
    }
});

// ELIMINAR NOTIFICACIÓN
app.delete('/api/notificaciones/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            'DELETE FROM notificaciones WHERE id = $1 AND estudiante_id = $2',
            [id, req.user.id]
        );
        
        res.json({ mensaje: 'Notificación eliminada' });
    } catch (error) {
        console.error('Error eliminando notificación:', error);
        res.status(500).json({ error: 'Error al eliminar notificación' });
    }
});

// CREAR NOTIFICACIÓN (función interna)
async function crearNotificacion(estudiante_id, titulo, mensaje, tipo = 'info') {
    try {
        await pool.query(
            `INSERT INTO notificaciones (estudiante_id, titulo, mensaje, tipo, leida) 
             VALUES ($1, $2, $3, $4, FALSE)`,
            [estudiante_id, titulo, mensaje, tipo]
        );
    } catch (error) {
        console.error('Error creando notificación:', error);
    }
}