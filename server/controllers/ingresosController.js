const db = require('../config/database');

exports.crearIngreso = async (req, res) => {
  const { tanque_id, empresa_id, cantidad_litros, numero_factura_proveedor, observaciones } = req.body;
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Insertar el ingreso
    const { rows } = await client.query(`
      INSERT INTO ingresos (tanque_id, empresa_id, cantidad_litros, numero_factura_proveedor, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [tanque_id, empresa_id, cantidad_litros, numero_factura_proveedor, observaciones]);
    
    // 2. Actualizar el stock del tanque
    await client.query(`
      UPDATE tanques 
      SET stock_actual = stock_actual + $1, updated_at = NOW()
      WHERE id = $2
    `, [cantidad_litros, tanque_id]);
    
    await client.query('COMMIT');
    res.json({ id: rows[0].id, mensaje: 'Ingreso registrado y stock actualizado' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getHistorial = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT i.*, t.identificador as tanque_identificador, t.tipo_carburante 
      FROM ingresos i
      JOIN tanques t ON i.tanque_id = t.id
      ORDER BY i.fecha_hora DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
