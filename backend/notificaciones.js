const { Pool } = require('pg');
const pool = new Pool({ /* misma config */ });

async function enviarNotificaciones() {
    // Lógica para enviar emails/whatsapp
    // 1 notificación diaria, 5 cuando queden 2 días
}

// Ejecutar cada día
setInterval(enviarNotificaciones, 24 * 60 * 60 * 1000);