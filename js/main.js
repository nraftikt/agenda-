// ==========================================
// CONFIGURACIÓN
// ==========================================
const API_URL = '/api';
let tareasGlobales = [];
let filtroActual = 'todas';

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
    if (!verificarAutenticacion()) {
        window.location.href = 'login.html';
        return;
    }
    
    inicializarApp();
});

function inicializarApp() {
    cargarPerfil();
    cargarEstadisticas();
    configurarNavegacion();
    cargarNotificaciones(); // ← AGREGAR ESTA LÍNEA
}

function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function configurarNavegacion() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            navigateTo(view);
        });
    });
}

function navigateTo(viewName) {
    console.log('🔄 Navegando a:', viewName);
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view-content').forEach(v => {
        v.classList.add('hidden');
    });
    
    // Mostrar vista seleccionada
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Actualizar título
    const titles = {
        'principal': 'Dashboard Principal',
        'perfil': 'Mi Perfil',
        'clases': 'Mis Clases',
        'tareas': 'Gestión de Tareas'
    };
    document.getElementById('page-title').textContent = titles[viewName] || 'TaskManager';
    
    // Cargar datos de la vista
    switch(viewName) {
        case 'clases':
            cargarClases();
            break;
        case 'tareas':
            cargarTareas();
            cargarMateriasParaSelect();
            break;
        case 'perfil':
            cargarPerfil();
            break;
        case 'principal':
            cargarTareasProximas();
            break;
    }
}

// ==========================================
// PERFIL
// ==========================================
async function cargarPerfil() {
    try {
        console.log('👤 Cargando perfil...');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar perfil');
        
        const user = await response.json();
        console.log('✅ Perfil cargado:', user);
        
        // Actualizar UI
        document.getElementById('user-name').textContent = user.nombre || 'Usuario';
        document.getElementById('user-avatar').textContent = 
            user.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'US';
        document.getElementById('welcome-message').textContent = 
            `¡Bienvenido de vuelta, ${user.nombre?.split(' ')[0] || 'Estudiante'}! 👋`;
        
        // Llenar formulario
        document.getElementById('nombre').value = user.nombre || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('telefono').value = user.telefono || '';
        document.getElementById('carrera').value = user.carrera || '';
        document.getElementById('semestre').value = user.semestre || '';
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
    }
}

async function guardarPerfil() {
    try {
        const token = localStorage.getItem('token');
        const data = {
            nombre: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            carrera: document.getElementById('carrera').value,
            semestre: document.getElementById('semestre').value
        };

        const response = await fetch(`${API_URL}/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Error al guardar perfil');
        
        alert('✅ Perfil actualizado correctamente');
        cargarPerfil();
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al guardar el perfil');
    }
}

// ==========================================
// ESTADÍSTICAS
// ==========================================
async function cargarEstadisticas() {
    try {
        console.log('📊 Cargando estadísticas...');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/estadisticas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const stats = await response.json();
        console.log('✅ Estadísticas:', stats);
        
        document.getElementById('stats-completadas').textContent = 
            `${stats.completadas || 0} Tareas Completadas`;
        document.getElementById('stats-pendientes').textContent = 
            `${stats.pendientes || 0} Tareas Pendientes`;
        document.getElementById('stats-vencidas').textContent = 
            `${stats.vencidas || 0} Tareas Vencidas`;
            
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

// ==========================================
// CLASES
// ==========================================
async function cargarClases() {
    try {
        console.log('📚 Cargando clases...');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar materias');
        
        const materias = await response.json();
        console.log('✅ Clases cargadas:', materias);
        
        mostrarClases(materias);
        
    } catch (error) {
        console.error('❌ Error cargando clases:', error);
        document.getElementById('clases-container').innerHTML = 
            '<p style="text-align: center;">Error al cargar las clases</p>';
    }
}

function mostrarClases(materias) {
    const container = document.getElementById('clases-container');
    
    if (!materias || materias.length === 0) {
        container.innerHTML = '<p style="text-align: center;">No hay clases disponibles</p>';
        return;
    }
    
    container.innerHTML = materias.map(materia => `
        <div class="clase-card">
            <div class="clase-icon">${materia.icono || '📚'}</div>
            <h3>${materia.nombre}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 10px;">
                ${materia.descripcion || 'Sin descripción'}
            </p>
            <div class="tareas-count">${materia.tareas_pendientes || 0} tareas pendientes</div>
        </div>
    `).join('');
}

// ==========================================
// TAREAS
// ==========================================
async function cargarTareas() {
    try {
        console.log('📝 Cargando tareas...');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/tareas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar tareas');
        
        tareasGlobales = await response.json();
        console.log('✅ Tareas cargadas:', tareasGlobales.length);
        
        filtrarTareas(filtroActual);
        
    } catch (error) {
        console.error('❌ Error cargando tareas:', error);
        document.getElementById('tareas-container').innerHTML = 
            '<p style="text-align: center;">Error al cargar las tareas</p>';
    }
}

function filtrarTareas(filtro) {
    console.log('🔍 Filtrando tareas:', filtro);
    filtroActual = filtro;
    
    // Actualizar tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event?.target?.classList.add('active');
    
    let tareasFiltradas = [];
    
    switch(filtro) {
        case 'pendientes':
            tareasFiltradas = tareasGlobales.filter(t => !t.completada && !t.vencida);
            break;
        case 'completadas':
            tareasFiltradas = tareasGlobales.filter(t => t.completada);
            break;
        case 'vencidas':
            tareasFiltradas = tareasGlobales.filter(t => !t.completada && t.vencida);
            break;
        default:
            tareasFiltradas = tareasGlobales;
    }
    
    mostrarTareas(tareasFiltradas);
}

function mostrarTareas(tareas) {
    const container = document.getElementById('tareas-container');
    
    if (!tareas || tareas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                <h3>No hay tareas</h3>
                <p style="color: var(--text-secondary);">¡Crea tu primera tarea para comenzar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tareas.map(tarea => `
        <div class="tarea-item ${tarea.completada ? 'completada' : ''} ${tarea.vencida ? 'vencida' : ''}">
            <div class="tarea-header">
                <div class="tarea-title">${tarea.titulo}</div>
                <div class="tarea-acciones">
                    <input type="checkbox" 
                           ${tarea.completada ? 'checked' : ''} 
                           onchange="marcarTarea(${tarea.id}, this.checked)"
                           style="width: 20px; height: 20px; cursor: pointer;">
                </div>
            </div>
            
            <div class="tarea-info" style="margin: 10px 0;">
                <span class="tarea-clase">${tarea.clase}</span>
                <span class="tarea-prioridad ${tarea.prioridad}" style="margin-left: 10px;">
                    ${getPrioridadIcono(tarea.prioridad)} ${tarea.prioridad}
                </span>
            </div>
            
            ${tarea.descripcion ? `<p style="color: var(--text-secondary); margin: 10px 0;">${tarea.descripcion}</p>` : ''}
            
            <div class="tarea-fecha">
                📅 ${tarea.vencida ? 'Venció' : 'Vence'}: ${formatearFecha(tarea.fecha_vencimiento)}
            </div>
        </div>
    `).join('');
}

function getPrioridadIcono(prioridad) {
    const iconos = { 'baja': '🟢', 'media': '🟡', 'alta': '🔴' };
    return iconos[prioridad] || '⚪';
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// ==========================================
// TAREAS PRÓXIMAS (Dashboard)
// ==========================================
async function cargarTareasProximas() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/tareas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error');
        
        const tareas = await response.json();
        const tareasProximas = tareas
            .filter(t => !t.completada && !t.vencida)
            .slice(0, 5);
        
        const container = document.getElementById('tareas-proximas');
        
        if (tareasProximas.length === 0) {
            container.innerHTML = '<p style="text-align: center;">🎉 No hay tareas pendientes</p>';
            return;
        }
        
        container.innerHTML = tareasProximas.map(tarea => `
            <div style="padding: 10px; background: var(--bg-card); border-radius: 8px; margin-bottom: 10px;">
                <strong>${tarea.titulo}</strong><br>
                <small style="color: var(--text-secondary);">
                    📚 ${tarea.clase} • 📅 ${formatearFecha(tarea.fecha_vencimiento)}
                </small>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// MARCAR TAREA
// ==========================================
async function marcarTarea(tareaId, completada) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/tareas/${tareaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completada })
        });

        if (!response.ok) throw new Error('Error al actualizar tarea');
        
        console.log('✅ Tarea actualizada');
        
        // Actualizar tarea en el array global
        const index = tareasGlobales.findIndex(t => t.id === tareaId);
        if (index !== -1) {
            tareasGlobales[index].completada = completada;
        }
        
        // Recargar vistas
        filtrarTareas(filtroActual);
        cargarEstadisticas();
        cargarTareasProximas();
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al actualizar la tarea');
    }
}

// ==========================================
// CARGAR MATERIAS PARA SELECT
// ==========================================
async function cargarMateriasParaSelect() {
    try {
        console.log('📚 Cargando materias para select...');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error');
        
        const materias = await response.json();
        const select = document.getElementById('nueva-tarea-materia');
        
        if (!select) {
            console.error('❌ Select no encontrado');
            return;
        }
        
        select.innerHTML = '<option value="">Seleccionar materia...</option>';
        materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = materia.nombre;
            select.appendChild(option);
        });
        
        console.log('✅ Materias cargadas en select:', materias.length);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ==========================================
// CREAR NUEVA TAREA
// ==========================================
async function crearNuevaTarea(event) {
    event.preventDefault();
    
    const materiaId = parseInt(document.getElementById('nueva-tarea-materia').value);
    
    if (!materiaId) {
        alert('❌ Por favor selecciona una materia');
        return;
    }

    const tareaData = {
        titulo: document.getElementById('nueva-tarea-titulo').value,
        descripcion: document.getElementById('nueva-tarea-descripcion').value,
        materia_id: materiaId,
        prioridad: document.getElementById('nueva-tarea-prioridad').value,
        fecha_vencimiento: document.getElementById('nueva-tarea-fecha').value
    };

    console.log('📤 Enviando tarea:', tareaData);

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/tareas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tareaData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear tarea');
        }

        const result = await response.json();
        console.log('✅ Tarea creada:', result);
        
        alert('✅ Tarea creada exitosamente');
        
        // Limpiar formulario
        document.getElementById('form-nueva-tarea').reset();
        
        // Recargar datos
        cargarTareas();
        cargarEstadisticas();
        cargarTareasProximas();
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al crear la tarea: ' + error.message);
    }
}

// ==========================================
// UTILIDADES
// ==========================================
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeText = document.getElementById('theme-text');
    const themeIcon = document.getElementById('theme-icon');
    
    if (document.body.classList.contains('light-mode')) {
        themeText.textContent = '☀️ Modo Claro';
        themeIcon.textContent = '🌙';
    } else {
        themeText.textContent = '🌙 Modo Oscuro';
        themeIcon.textContent = '☀️';
    }
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}





















// ==========================================
// NOTIFICACIONES
// ==========================================
let notificaciones = [];

// Cargar notificaciones al iniciar la app
async function cargarNotificaciones() {
    try {
        console.log('🔔 Cargando notificaciones...');
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/notificaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            notificaciones = await response.json();
            console.log('✅ Notificaciones cargadas:', notificaciones.length);
            actualizarBadgeNotificaciones();
            mostrarNotificaciones();
        }
    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
    }
}

function actualizarBadgeNotificaciones() {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    const badge = document.getElementById('notification-count');
    if (badge) {
        badge.textContent = noLeidas;
        badge.style.display = noLeidas > 0 ? 'flex' : 'none';
    }
}

function mostrarNotificaciones() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (notificaciones.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
                <h4>No hay notificaciones</h4>
                <p style="color: var(--text-secondary);">¡Todo al día!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificaciones.map(notif => `
        <div class="notification-item ${!notif.leida ? 'no-leida' : ''} ${notif.reciente ? 'reciente' : ''}">
            <div class="notification-header">
                <div class="notification-title">${notif.titulo}</div>
                <div class="notification-time">${formatearTiempo(notif.fecha_creacion)}</div>
            </div>
            <p class="notification-message">${notif.mensaje}</p>
            <div class="notification-actions">
                <span class="notification-tipo tipo-${notif.tipo}">${notif.tipo}</span>
                ${!notif.leida ? 
                    `<button class="btn-small" onclick="marcarNotificacionLeida(${notif.id})">✅ Leída</button>` : 
                    ''
                }
                <button class="btn-small btn-danger" onclick="eliminarNotificacion(${notif.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function formatearTiempo(fecha) {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diffMs = ahora - notifFecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return notifFecha.toLocaleDateString();
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('hidden');
    
    if (!panel.classList.contains('hidden')) {
        cargarNotificaciones();
    }
}

async function marcarNotificacionLeida(notificacionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/notificaciones/${notificacionId}/leer`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Actualizar localmente
            const notifIndex = notificaciones.findIndex(n => n.id === notificacionId);
            if (notifIndex !== -1) {
                notificaciones[notifIndex].leida = true;
            }
            actualizarBadgeNotificaciones();
            mostrarNotificaciones();
        }
    } catch (error) {
        console.error('❌ Error marcando notificación:', error);
    }
}

async function eliminarNotificacion(notificacionId) {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/notificaciones/${notificacionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Eliminar localmente
            notificaciones = notificaciones.filter(n => n.id !== notificacionId);
            actualizarBadgeNotificaciones();
            mostrarNotificaciones();
        }
    } catch (error) {
        console.error('❌ Error eliminando notificación:', error);
    }
}