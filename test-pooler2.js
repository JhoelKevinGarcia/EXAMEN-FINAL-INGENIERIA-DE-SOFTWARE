const { Pool } = require('pg');

async function test(url) {
  const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    const res = await p.query('SELECT 1 as val');
    console.log(`✅ EXITO con: ${url}`);
  } catch (err) {
    console.error(`❌ FALLO con: ${url}\nError: ${err.message}`);
  } finally {
    p.end();
  }
}

async function run() {
  await test('postgresql://postgres.xsuqtsvyorwmbwcptwbl:jhoel%40123JK@db.xsuqtsvyorwmbwcptwbl.supabase.co:6543/postgres');
  await test('postgresql://postgres:jhoel%40123JK@db.xsuqtsvyorwmbwcptwbl.supabase.co:6543/postgres');
}
run();
