const db = require('../config/database');

exports.getTanques = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tanques ORDER BY identificador');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crearTanque = async (req, res) => {
  const { identificador, tipo_carburante, capacidad_maxima, stock_minimo, stock_actual } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO tanques (empresa_id, identificador, tipo_carburante, capacidad_maxima, stock_minimo, stock_actual)
      VALUES (1, $1, $2, $3, $4, $5)
      RETURNING id
    `, [identificador, tipo_carburante, capacidad_maxima, stock_minimo, stock_actual || 0]);
    res.json({ id: rows[0].id, mensaje: 'Tanque creado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarTanque = async (req, res) => {
  const { id } = req.params;
  const { identificador, tipo_carburante, capacidad_maxima, stock_minimo } = req.body;
  try {
    await db.query(`
      UPDATE tanques 
      SET identificador=$1, tipo_carburante=$2, capacidad_maxima=$3, stock_minimo=$4, updated_at=NOW()
      WHERE id=$5
    `, [identificador, tipo_carburante, capacidad_maxima, stock_minimo, id]);
    res.json({ mensaje: 'Tanque actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.eliminarTanque = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT COUNT(*) as total FROM ventas WHERE tanque_id=$1', [id]);
    if (parseInt(rows[0].total) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un tanque con ventas registradas' });
    }
    await db.query('DELETE FROM tanques WHERE id=$1', [id]);
    res.json({ mensaje: 'Tanque eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStockActual = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT stock_actual, stock_minimo, capacidad_maxima FROM tanques WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Tanque no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
