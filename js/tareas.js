let tareas = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacion()) return;
    
    cargarTareas();
    cargarEstadisticas();
});

function cargarTareas() {
    const token = localStorage.getItem('token');
    
    fetch('/api/tareas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar tareas');
        return response.json();
    })
    .then(data => {
        tareas = data;
        mostrarTareas(data);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('lista-tareas').innerHTML = 
            '<p class="error">Error al cargar las tareas</p>';
    });
}

function cargarEstadisticas() {
    const token = localStorage.getItem('token');
    
    fetch('/api/estadisticas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(stats => {
        document.getElementById('total-tareas').textContent = stats.total_tareas || 0;
        document.getElementById('tareas-completadas').textContent = stats.completadas || 0;
        document.getElementById('tareas-pendientes').textContent = stats.pendientes || 0;
        document.getElementById('tareas-vencidas').textContent = stats.vencidas || 0;
    })
    .catch(error => console.error('Error:', error));
}

function mostrarTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');
    
    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="no-tareas">No hay tareas pendientes 🎉</p>';
        return;
    }

    contenedor.innerHTML = tareas.map(tarea => `
        <div class="tarea-item ${tarea.completada ? 'completada' : ''} ${tarea.vencida ? 'vencida' : ''}">
            <div class="tarea-info">
                <h3>${tarea.titulo}</h3>
                <p>${tarea.descripcion || 'Sin descripción'}</p>
                <div class="tarea-meta">
                    <span class="clase">${tarea.clase}</span>
                    <span class="fecha">Vence: ${new Date(tarea.fecha_vencimiento).toLocaleDateString()}</span>
                    <span class="prioridad ${tarea.prioridad}">${tarea.prioridad}</span>
                </div>
            </div>
            <div class="tarea-acciones">
                <label class="checkbox-container">
                    <input type="checkbox" ${tarea.completada ? 'checked' : ''} 
                           onchange="marcarTarea(${tarea.id}, this.checked)">
                    <span class="checkmark"></span>
                    Completada
                </label>
            </div>
        </div>
    `).join('');
}

function marcarTarea(tareaId, completada) {
    const token = localStorage.getItem('token');
    
    fetch(`/api/tareas/${tareaId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completada })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar tarea');
        cargarTareas();
        cargarEstadisticas();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar la tarea');
    });
}

function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}