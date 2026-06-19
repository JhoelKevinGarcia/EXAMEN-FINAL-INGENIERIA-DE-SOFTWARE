const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para Supabase / Render
  }
});

// Test de conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a Supabase PostgreSQL');
    release();
  }
});

module.exports = pool;
