const db = require('../config/database');

exports.getClientes = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clientes';
    const params = [];
    if (search) {
      query += ' WHERE documento ILIKE $1 OR nombre ILIKE $1 OR placa_vehiculo ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crearCliente = async (req, res) => {
  const { documento, nombre, placa_vehiculo, tipo_cliente } = req.body;
  try {
    const existe = await db.query(
      'SELECT id FROM clientes WHERE documento=$1 OR placa_vehiculo=$2',
      [documento, placa_vehiculo]
    );
    if (existe.rows[0]) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese documento o placa' });
    }
    const { rows } = await db.query(`
      INSERT INTO clientes (empresa_id, documento, nombre, placa_vehiculo, tipo_cliente, estado)
      VALUES (1, $1, $2, $3, $4, 'Activo')
      RETURNING *
    `, [documento, nombre, placa_vehiculo, tipo_cliente]);
    res.json({ cliente: rows[0], mensaje: 'Cliente creado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, placa_vehiculo, tipo_cliente, estado } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE clientes SET nombre=$1, placa_vehiculo=$2, tipo_cliente=$3, estado=$4
      WHERE id=$5 RETURNING *
    `, [nombre, placa_vehiculo, tipo_cliente, estado, id]);
    res.json({ cliente: rows[0], mensaje: 'Cliente actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.buscarCliente = async (req, res) => {
  const { query } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT * FROM clientes WHERE documento=$1 OR placa_vehiculo=$1',
      [query]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    await db.query('UPDATE clientes SET estado=$1 WHERE id=$2', [estado, id]);
    res.json({ mensaje: `Estado actualizado a ${estado}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistorialCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT v.*, t.tipo_carburante, t.identificador AS tanque_identificador
      FROM ventas v
      JOIN tanques t ON v.tanque_id = t.id
      WHERE v.cliente_id = $1
      ORDER BY v.fecha_hora DESC
      LIMIT 20
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPromedioSemanal = async (req, res) => {
  const { id } = req.params;
  try {
    const empRes = await db.query('SELECT dias_evaluacion_promedio FROM empresa LIMIT 1');
    const dias = empRes.rows[0]?.dias_evaluacion_promedio || 28;
    const { rows } = await db.query(`
      SELECT SUM(cantidad_autorizada) AS total_litros
      FROM ventas
      WHERE cliente_id=$1
        AND fecha_hora >= NOW() - ($2 * INTERVAL '1 day')
        AND estado='Completada'
    `, [id, dias]);
    const semanas = dias / 7;
    const promedio = (parseFloat(rows[0].total_litros) || 0) / semanas;
    res.json({ cliente_id: id, promedio_semanal: promedio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
