document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacion()) return;
    cargarMaterias();
});

function cargarMaterias() {
    const token = localStorage.getItem('token');
    
    fetch('/api/materias', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar materias');
        return response.json();
    })
    .then(materias => {
        mostrarMaterias(materias);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('lista-materias').innerHTML = 
            '<p class="error">Error al cargar las materias</p>';
    });
}

function mostrarMaterias(materias) {
    const contenedor = document.getElementById('lista-materias');
    
    if (materias.length === 0) {
        contenedor.innerHTML = '<p class="no-data">No hay materias registradas</p>';
        return;
    }

    contenedor.innerHTML = materias.map(materia => `
        <div class="materia-card">
            <div class="materia-header">
                <h3>${materia.nombre}</h3>
                <span class="tareas-count">${materia.tareas_pendientes} tareas</span>
            </div>
            <div class="materia-info">
                <p><strong>Código:</strong> ${materia.codigo || 'N/A'}</p>
                <p><strong>Créditos:</strong> ${materia.creditos || 'N/A'}</p>
                <p><strong>Profesor:</strong> ${materia.profesor || 'Por asignar'}</p>
            </div>
        </div>
    `).join('');
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