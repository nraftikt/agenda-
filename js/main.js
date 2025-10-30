// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacion()) {
        window.location.href = 'login.html';
        return;
    }
    
    cargarDatosUsuario();
    cargarEstadisticas();
    cargarTareasProximas();
    configurarNavegacion();
});

// Navegación entre vistas
function configurarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Actualizar navegación activa
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar vista correspondiente
            mostrarVista(view);
        });
    });
}

function mostrarVista(viewName) {
    // Ocultar todas las vistas
    const views = document.querySelectorAll('.view-content');
    views.forEach(view => view.classList.add('hidden'));
    
    // Mostrar vista seleccionada
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    
    // Actualizar título
    const titles = {
        'principal': 'Dashboard Principal',
        'perfil': 'Mi Perfil',
        'clases': 'Mis Clases',
        'tareas': 'Gestión de Tareas'
    };
    
    document.getElementById('page-title').textContent = titles[viewName] || 'Dashboard';
    
    // Cargar datos específicos de la vista
    if (viewName === 'clases') {
        cargarClases();
    } else if (viewName === 'tareas') {
        cargarTareasCompletas();
    } else if (viewName === 'perfil') {
        cargarPerfil();
    }
}

function navigateTo(viewName) {
    const navItem = document.querySelector(`[data-view="${viewName}"]`);
    if (navItem) {
        navItem.click();
    }
}

// Cargar datos del usuario
function cargarDatosUsuario() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.nombre) {
        document.getElementById('user-name').textContent = user.nombre;
        document.getElementById('welcome-message').textContent = `¡Bienvenido de vuelta, ${user.nombre.split(' ')[0]}! 👋`;
        
        // Crear avatar con iniciales
        const iniciales = user.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('user-avatar').textContent = iniciales;
    }
}

// Cargar estadísticas
function cargarEstadisticas() {
    const token = localStorage.getItem('token');
    
    fetch('/api/estadisticas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        return response.json();
    })
    .then(stats => {
        document.getElementById('stats-completadas').textContent = `${stats.completadas || 0} Tareas Completadas`;
        document.getElementById('stats-pendientes').textContent = `${stats.pendientes || 0} Tareas Pendientes`;
        document.getElementById('stats-vencidas').textContent = `${stats.vencidas || 0} Tareas Vencidas`;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Cargar tareas próximas
function cargarTareasProximas() {
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
    .then(tareas => {
        const tareasProximas = tareas
            .filter(t => !t.completada && !t.vencida)
            .slice(0, 5);
        
        mostrarTareasProximas(tareasProximas);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('tareas-proximas').innerHTML = '<p>Error al cargar tareas</p>';
    });
}

function mostrarTareasProximas(tareas) {
    const container = document.getElementById('tareas-proximas');
    
    if (tareas.length === 0) {
        container.innerHTML = '<p>No hay tareas próximas 🎉</p>';
        return;
    }
    
    container.innerHTML = tareas.map(tarea => `
        <div class="tarea-item-small">
            <div class="tarea-info-small">
                <strong>${tarea.titulo}</strong>
                <span>${tarea.clase}</span>
            </div>
            <div class="tarea-fecha">
                ${new Date(tarea.fecha_vencimiento).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// Cargar clases
function cargarClases() {
    const token = localStorage.getItem('token');
    
    fetch('/api/materias', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar clases');
        return response.json();
    })
    .then(clases => {
        mostrarClases(clases);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('clases-container').innerHTML = '<p>Error al cargar las clases</p>';
    });
}

function mostrarClases(clases) {
    const container = document.getElementById('clases-container');
    
    if (clases.length === 0) {
        container.innerHTML = '<p>No hay clases registradas</p>';
        return;
    }
    
    container.innerHTML = clases.map(clase => `
        <div class="clase-card">
            <div class="clase-header">
                <h3>${clase.nombre}</h3>
                <span class="tareas-count">${clase.tareas_pendientes || 0} tareas</span>
            </div>
            <div class="clase-info">
                <p><strong>Código:</strong> ${clase.codigo || 'N/A'}</p>
                <p><strong>Créditos:</strong> ${clase.creditos || 'N/A'}</p>
                <p><strong>Profesor:</strong> ${clase.profesor || 'Por asignar'}</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('total-clases').textContent = `${clases.length} clases`;
    document.getElementById('total-tareas-clases').textContent = 
        `${clases.reduce((total, clase) => total + (clase.tareas_pendientes || 0), 0)} tareas totales`;
}

// Cargar todas las tareas
function cargarTareasCompletas() {
    const token = localStorage.getItem('token');
    
    // 🆕 AGREGAR ESTA LÍNEA - Cargar materias para el select
    cargarMateriasParaSelect();
    
    fetch('/api/tareas', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar tareas');
        return response.json();
    })
    .then(tareas => {
        const tareasActuales = tareas.filter(t => !t.completada && !t.vencida);
        const tareasVencidas = tareas.filter(t => !t.completada && t.vencida);
        
        mostrarTareasActuales(tareasActuales);
        mostrarTareasVencidas(tareasVencidas);
        
        document.getElementById('tareas-actuales-count').textContent = `${tareasActuales.length} actuales`;
        document.getElementById('tareas-vencidas-count').textContent = `${tareasVencidas.length} vencidas`;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('tareas-actuales').innerHTML = '<p>Error al cargar tareas</p>';
        document.getElementById('tareas-vencidas').innerHTML = '<p>Error al cargar tareas</p>';
    });
}

function mostrarTareasActuales(tareas) {
    const container = document.getElementById('tareas-actuales');
    
    if (tareas.length === 0) {
        container.innerHTML = '<p>No hay tareas actuales 🎉</p>';
        return;
    }
    
    container.innerHTML = tareas.map(tarea => `
        <div class="tarea-item-detalle">
            <div class="tarea-checkbox">
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} 
                       onchange="marcarTarea(${tarea.id}, this.checked)">
            </div>
            <div class="tarea-contenido">
                <h4>${tarea.titulo}</h4>
                <p>${tarea.descripcion || 'Sin descripción'}</p>
                <div class="tarea-meta">
                    <span class="clase-badge">${tarea.clase}</span>
                    <span class="fecha">Vence: ${new Date(tarea.fecha_vencimiento).toLocaleDateString()}</span>
                    <span class="prioridad ${tarea.prioridad}">${tarea.prioridad}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function mostrarTareasVencidas(tareas) {
    const container = document.getElementById('tareas-vencidas');
    
    if (tareas.length === 0) {
        container.innerHTML = '<p>No hay tareas vencidas ✅</p>';
        return;
    }
    
    container.innerHTML = tareas.map(tarea => `
        <div class="tarea-item-detalle vencida">
            <div class="tarea-checkbox">
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} 
                       onchange="marcarTarea(${tarea.id}, this.checked)">
            </div>
            <div class="tarea-contenido">
                <h4>${tarea.titulo}</h4>
                <p>${tarea.descripcion || 'Sin descripción'}</p>
                <div class="tarea-meta">
                    <span class="clase-badge">${tarea.clase}</span>
                    <span class="fecha vencida-text">Vencida: ${new Date(tarea.fecha_vencimiento).toLocaleDateString()}</span>
                    <span class="prioridad ${tarea.prioridad}">${tarea.prioridad}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Marcar tarea como completada/pendiente
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
        
        // Recargar datos
        cargarEstadisticas();
        cargarTareasProximas();
        if (document.getElementById('tareas-view').classList.contains('hidden') === false) {
            cargarTareasCompletas();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar la tarea');
    });
}

// Cargar y guardar perfil
function cargarPerfil() {
    const token = localStorage.getItem('token');
    
    fetch('/api/perfil', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar perfil');
        return response.json();
    })
    .then(perfil => {
        document.getElementById('nombre').value = perfil.nombre || '';
        document.getElementById('email').value = perfil.email || '';
        document.getElementById('telefono').value = perfil.telefono || '';
        document.getElementById('carrera').value = perfil.carrera || '';
        document.getElementById('semestre').value = perfil.semestre || '';
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensajePerfil('Error al cargar el perfil', 'error');
    });
}

function guardarPerfil() {
    const token = localStorage.getItem('token');
    const formData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        carrera: document.getElementById('carrera').value,
        semestre: document.getElementById('semestre').value
    };

    fetch('/api/perfil', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar perfil');
        return response.json();
    })
    .then(data => {
        mostrarMensajePerfil('Perfil actualizado correctamente', 'success');
        // Actualizar datos en localStorage y UI
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.nombre = formData.nombre;
        localStorage.setItem('user', JSON.stringify(user));
        cargarDatosUsuario();
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensajePerfil('Error al actualizar el perfil', 'error');
    });
}

function mostrarMensajePerfil(mensaje, tipo) {
    const messageDiv = document.getElementById('perfil-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = tipo === 'success' ? 'message-success' : 'message-error';
    messageDiv.classList.remove('message-hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('message-hidden');
    }, 3000);
}

function cambiarPassword() {
    alert('Funcionalidad de cambio de contraseña en desarrollo');
}

// Verificar autenticación
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }
    return true;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Toggle tema oscuro/claro
function toggleTheme() {
    const body = document.body;
    const themeText = document.getElementById('theme-text');
    const themeIcon = document.getElementById('theme-icon');
    
   if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        themeText.textContent = '🌙 Modo Oscuro';
        themeIcon.textContent = '☀️';
    } else {
        body.classList.add('light-mode');
        themeText.textContent = '☀️ Modo Claro';
        themeIcon.textContent = '🌙';
    }
}




// Función para cargar materias en el select
function cargarMateriasParaSelect() {
    const token = localStorage.getItem('token');
    console.log('🔍 Iniciando carga de materias para select...'); // Debug
    
    fetch('/api/materias', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('🔍 Respuesta del servidor:', response.status); // Debug
        if (!response.ok) throw new Error('Error al cargar materias');
        return response.json();
    })
    .then(materias => {
        console.log('🔍 Materias recibidas:', materias); // Debug
        
        const select = document.getElementById('nueva-tarea-materia');
        console.log('🔍 Select encontrado:', select); // Debug
        
        select.innerHTML = '<option value="">Seleccionar materia...</option>';
        
        materias.forEach(materia => {
            console.log('🔍 Agregando materia:', materia.nombre); // Debug
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = materia.nombre;
            select.appendChild(option);
        });
        
        console.log('✅ Select llenado correctamente'); // Debug
    })
    .catch(error => {
        console.error('❌ Error cargando materias:', error);
    });
}




// Función para crear nueva tarea
function crearNuevaTarea() {
    const token = localStorage.getItem('token');
    const formData = {
        titulo: document.getElementById('nueva-tarea-titulo').value,
        descripcion: document.getElementById('nueva-tarea-descripcion').value,
        materia_id: document.getElementById('nueva-tarea-materia').value,
        prioridad: document.getElementById('nueva-tarea-prioridad').value,
        fecha_vencimiento: document.getElementById('nueva-tarea-fecha').value
    };

    // Validación
    if (!formData.titulo || !formData.materia_id || !formData.fecha_vencimiento) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    fetch('/api/tareas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al crear tarea');
        return response.json();
    })
    .then(data => {
        alert('✅ Tarea creada exitosamente');
        // Limpiar formulario
        document.getElementById('form-nueva-tarea').reset();
        // Recargar tareas
        cargarTareasCompletas();
        cargarEstadisticas();
        cargarTareasProximas();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ Error al crear la tarea');
    });
}

// En la función cargarTareasCompletas, agrega al inicio:
function cargarTareasCompletas() {
    const token = localStorage.getItem('token');
    
    // Cargar materias para el select
    cargarMateriasParaSelect();
    
    // Resto del código igual...
}

// Agregar evento al formulario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-nueva-tarea');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            crearNuevaTarea();
        });
    }
});





function cargarMateriasParaSelect() {
    const token = localStorage.getItem('token');
    console.log('🔍 Token:', token); // Para debug
    
    fetch('/api/materias', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('🔍 Respuesta materias:', response.status); // Debug
        if (!response.ok) throw new Error('Error al cargar materias');
        return response.json();
    })
    .then(materias => {
        console.log('🔍 Materias recibidas:', materias); // Debug
        const select = document.getElementById('nueva-tarea-materia');
        console.log('🔍 Select encontrado:', select); // Debug
        
        select.innerHTML = '<option value="">Seleccionar materia...</option>';
        
        materias.forEach(materia => {
            console.log('🔍 Agregando materia:', materia); // Debug
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = materia.nombre;
            select.appendChild(option);
        });
        
        console.log('🔍 Select después de llenar:', select.innerHTML); // Debug
    })
    .catch(error => {
        console.error('❌ Error cargando materias:', error);
    });
}