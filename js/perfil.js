document.addEventListener('DOMContentLoaded', function() {
    if (!verificarAutenticacion()) return;
    cargarPerfil();
});

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
        llenarFormulario(perfil);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar el perfil');
    });
}

function llenarFormulario(perfil) {
    document.getElementById('nombre').value = perfil.nombre || '';
    document.getElementById('email').value = perfil.email || '';
    document.getElementById('telefono').value = perfil.telefono || '';
    document.getElementById('carrera').value = perfil.carrera || '';
    document.getElementById('semestre').value = perfil.semestre || '';
}

document.getElementById('form-perfil').addEventListener('submit', function(e) {
    e.preventDefault();
    actualizarPerfil();
});

function actualizarPerfil() {
    const token = localStorage.getItem('token');
    const formData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        carrera: document.getElementById('carrera').value,
        semestre: parseInt(document.getElementById('semestre').value)
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
        alert('Perfil actualizado correctamente');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al actualizar el perfil');
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