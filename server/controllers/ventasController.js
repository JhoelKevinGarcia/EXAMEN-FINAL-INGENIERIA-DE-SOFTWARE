const db = require('../config/database');

exports.validarCupo = async (req, res) => {
  const { cliente_identificador, cantidad_solicitada } = req.body;

  try {
    // 1. Obtener configuración de empresa
    const empRes = await db.query('SELECT * FROM empresa LIMIT 1');
    const empresa = empRes.rows[0];
    if (!empresa) return res.status(500).json({ error: 'Configuración de empresa no encontrada' });

    // 2. Buscar o crear cliente
    let clienteRes = await db.query(
      'SELECT * FROM clientes WHERE documento=$1 OR placa_vehiculo=$1',
      [cliente_identificador]
    );
    let cliente = clienteRes.rows[0];
    let esClienteNuevo = false;

    if (!cliente) {
      const ins = await db.query(`
        INSERT INTO clientes (empresa_id, documento, nombre, placa_vehiculo, tipo_cliente, estado)
        VALUES (1, $1, 'Cliente Autogenerado', $1, 'Particular', 'Activo')
        RETURNING *
      `, [cliente_identificador]);
      cliente = ins.rows[0];
      esClienteNuevo = true;
    }

    // 3. Verificar suspensión
    if (cliente.estado === 'Suspendido') {
      return res.json({
        cliente_info: cliente,
        puede_procesar: false,
        promedio_semanal: 0,
        limite_permitido: 0,
        mensaje_advertencia: 'Cliente suspendido'
      });
    }

    // 4. Calcular cupo dinámico
    let limite_permitido = 0;
    let promedio_semanal = 0;

    if (!cliente.primera_compra || esClienteNuevo) {
      limite_permitido = parseFloat(empresa.cupo_base_clientes_nuevos);
      promedio_semanal = limite_permitido;
    } else {
      const dias = parseInt(empresa.dias_evaluacion_promedio);
      const ventRes = await db.query(`
        SELECT SUM(cantidad_autorizada) AS total_litros
        FROM ventas
        WHERE cliente_id=$1
          AND fecha_hora >= NOW() - ($2 * INTERVAL '1 day')
          AND estado='Completada'
      `, [cliente.id, dias]);
      const totalLitros = parseFloat(ventRes.rows[0].total_litros) || 0;
      const semanas = dias / 7;
      promedio_semanal = totalLitros / semanas;

      if (promedio_semanal === 0) {
        limite_permitido = parseFloat(empresa.cupo_base_clientes_nuevos);
      } else {
        limite_permitido = promedio_semanal * (1 + parseFloat(empresa.factor_holgura));
      }
    }

    const excede = parseFloat(cantidad_solicitada) > limite_permitido;

    res.json({
      cliente_info: cliente,
      promedio_semanal,
      limite_permitido,
      puede_procesar: !excede,
      mensaje_advertencia: excede ? `Excede el límite permitido. Máximo: ${limite_permitido.toFixed(2)} L` : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.procesarVenta = async (req, res) => {
  const { cliente_id, tanque_id, cantidad_autorizada } = req.body;
  const client = await db.connect(); // cliente dedicado para transacción

  try {
    await client.query('BEGIN');

    // Obtener empresa
    const empRes = await client.query('SELECT * FROM empresa LIMIT 1');
    const empresa = empRes.rows[0];

    // Verificar y bloquear tanque
    const tanqRes = await client.query(
      'SELECT * FROM tanques WHERE id=$1 FOR UPDATE',
      [tanque_id]
    );
    const tanque = tanqRes.rows[0];
    if (!tanque || parseFloat(tanque.stock_actual) < parseFloat(cantidad_autorizada)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock insuficiente en el tanque' });
    }

    // Obtener cliente
    const cliRes  = await client.query('SELECT * FROM clientes WHERE id=$1', [cliente_id]);
    const cliente = cliRes.rows[0];

    // Calcular límite
    let limite_permitido = parseFloat(empresa.cupo_base_clientes_nuevos);
    let promedio_semanal = limite_permitido;

    if (cliente.primera_compra) {
      const dias = parseInt(empresa.dias_evaluacion_promedio);
      const vRes = await client.query(`
        SELECT SUM(cantidad_autorizada) AS total_litros FROM ventas
        WHERE cliente_id=$1 AND fecha_hora >= NOW() - ($2 * INTERVAL '1 day') AND estado='Completada'
      `, [cliente.id, dias]);
      const totalLitros = parseFloat(vRes.rows[0].total_litros) || 0;
      const semanas = dias / 7;
      promedio_semanal = totalLitros / semanas;
      if (promedio_semanal > 0) {
        limite_permitido = promedio_semanal * (1 + parseFloat(empresa.factor_holgura));
      }
    }

    const fue_limitada = parseFloat(cantidad_autorizada) >= limite_permitido;

    // Insertar venta
    const ventaRes = await client.query(`
      INSERT INTO ventas (cliente_id, tanque_id, empresa_id, cantidad_solicitada, cantidad_autorizada,
                          fue_limitada, promedio_semanal_cliente, limite_permitido, estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Completada')
      RETURNING id
    `, [cliente.id, tanque.id, empresa.id, cantidad_autorizada, cantidad_autorizada,
        fue_limitada, promedio_semanal, limite_permitido]);

    // Descontar stock
    const nuevoStock = parseFloat(tanque.stock_actual) - parseFloat(cantidad_autorizada);
    await client.query(
      'UPDATE tanques SET stock_actual=$1, updated_at=NOW() WHERE id=$2',
      [nuevoStock, tanque.id]
    );

    // Registrar primera compra si aplica
    if (!cliente.primera_compra) {
      await client.query(
        'UPDATE clientes SET primera_compra=NOW() WHERE id=$1',
        [cliente.id]
      );
    }

    await client.query('COMMIT');

    res.json({
      venta_id: ventaRes.rows[0].id,
      comprobante: {
        cliente:              cliente.nombre,
        documento:            cliente.documento,
        placa:                cliente.placa_vehiculo,
        cantidad_despachada:  parseFloat(cantidad_autorizada),
        tipo_carburante:      tanque.tipo_carburante,
        limite_disponible:    limite_permitido,
        fecha:                new Date().toISOString()
      },
      nuevo_stock_tanque: nuevoStock,
      estado: 'Completada'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getReporte = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT v.*, c.nombre AS cliente_nombre, c.placa_vehiculo, t.tipo_carburante
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN tanques  t ON v.tanque_id  = t.id
      ORDER BY v.fecha_hora DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
