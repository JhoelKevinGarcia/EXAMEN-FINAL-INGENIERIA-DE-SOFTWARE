const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:jhoel%40123JK@db.xsuqtsvyorwmbwcptwbl.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const [totalVentas, totalClientes, clientesSuspendidos, ventasHoy, tanques] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, SUM(cantidad_autorizada) as litros FROM ventas WHERE estado='Completada'"),
      pool.query("SELECT COUNT(*) as total FROM clientes"),
      pool.query("SELECT COUNT(*) as total FROM clientes WHERE estado='Suspendido'"),
      pool.query("SELECT COUNT(*) as total, SUM(cantidad_autorizada) as litros FROM ventas WHERE DATE(fecha_hora)=CURRENT_DATE AND estado='Completada'"),
      pool.query("SELECT * FROM tanques ORDER BY identificador")
    ]);
    console.log('EXITO!! Todas las queries pasaron.');
  } catch (err) {
    console.error('ERROR DB:', err.message);
  } finally {
    pool.end();
  }
}
run();
