const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.xsuqtsvyorwmbwcptwbl:jhoel%40123JK@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT * FROM empresa');
    console.log('POOLER EXITO. Data:', res.rows);
  } catch (err) {
    console.error('POOLER ERROR DB:', err);
  } finally {
    pool.end();
  }
}
run();
