const db = require('../config/database');

exports.getEmpresa = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM empresa LIMIT 1');
    if (!rows[0]) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarEmpresa = async (req, res) => {
  const { nombre, nit, direccion, ciudad, telefono, cupo_base_clientes_nuevos, factor_holgura, dias_evaluacion_promedio } = req.body;
  try {
    await db.query(`
      UPDATE empresa
      SET nombre=$1, nit=$2, direccion=$3, ciudad=$4, telefono=$5,
          cupo_base_clientes_nuevos=$6, factor_holgura=$7, dias_evaluacion_promedio=$8
      WHERE id=1
    `, [nombre, nit, direccion, ciudad, telefono, cupo_base_clientes_nuevos, factor_holgura, dias_evaluacion_promedio]);
    res.json({ mensaje: 'Configuración actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  try {
    const [totalVentas, totalClientes, clientesSuspendidos, ventasHoy, tanques] = await Promise.all([
      db.query("SELECT COUNT(*) as total, SUM(cantidad_autorizada) as litros FROM ventas WHERE estado='Completada'"),
      db.query("SELECT COUNT(*) as total FROM clientes"),
      db.query("SELECT COUNT(*) as total FROM clientes WHERE estado='Suspendido'"),
      db.query("SELECT COUNT(*) as total, SUM(cantidad_autorizada) as litros FROM ventas WHERE DATE(fecha_hora)=CURRENT_DATE AND estado='Completada'"),
      db.query("SELECT * FROM tanques ORDER BY identificador")
    ]);

    res.json({
      total_ventas:          parseInt(totalVentas.rows[0].total),
      total_litros_vendidos: parseFloat(totalVentas.rows[0].litros || 0),
      total_clientes:        parseInt(totalClientes.rows[0].total),
      clientes_suspendidos:  parseInt(clientesSuspendidos.rows[0].total),
      ventas_hoy:            parseInt(ventasHoy.rows[0].total),
      litros_hoy:            parseFloat(ventasHoy.rows[0].litros || 0),
      tanques:               tanques.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
