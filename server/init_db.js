const db = require('./config/database');

console.log("Iniciando creación de la base de datos...");

try {
  // Tabla Empresa
  db.exec(`
    CREATE TABLE IF NOT EXISTS empresa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR NOT NULL,
      nit VARCHAR UNIQUE NOT NULL,
      direccion VARCHAR,
      ciudad VARCHAR,
      telefono VARCHAR,
      cupo_base_clientes_nuevos NUMERIC NOT NULL,
      factor_holgura NUMERIC NOT NULL,
      dias_evaluacion_promedio INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla Tanques
  db.exec(`
    CREATE TABLE IF NOT EXISTS tanques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER,
      identificador VARCHAR UNIQUE NOT NULL,
      tipo_carburante TEXT CHECK(tipo_carburante IN ('Gasolina', 'Diesel')) NOT NULL,
      capacidad_maxima NUMERIC NOT NULL,
      stock_minimo NUMERIC NOT NULL,
      stock_actual NUMERIC NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresa (id)
    )
  `);

  // Tabla Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER,
      documento VARCHAR UNIQUE NOT NULL,
      nombre VARCHAR,
      placa_vehiculo VARCHAR,
      tipo_cliente TEXT CHECK(tipo_cliente IN ('Particular', 'Transporte_Publico', 'Empresa')),
      estado TEXT CHECK(estado IN ('Activo', 'Suspendido')) DEFAULT 'Activo',
      primera_compra DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresa (id)
    )
  `);

  // Tabla Ingresos
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanque_id INTEGER,
      empresa_id INTEGER,
      cantidad_litros NUMERIC NOT NULL,
      numero_factura_proveedor VARCHAR NOT NULL,
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      observaciones TEXT,
      FOREIGN KEY (tanque_id) REFERENCES tanques (id),
      FOREIGN KEY (empresa_id) REFERENCES empresa (id)
    )
  `);

  // Tabla Ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      tanque_id INTEGER,
      empresa_id INTEGER,
      cantidad_solicitada NUMERIC NOT NULL,
      cantidad_autorizada NUMERIC NOT NULL,
      fue_limitada BOOLEAN NOT NULL,
      promedio_semanal_cliente NUMERIC,
      limite_permitido NUMERIC,
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado TEXT CHECK(estado IN ('Completada', 'Rechazada', 'Parcial')) NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id),
      FOREIGN KEY (tanque_id) REFERENCES tanques (id),
      FOREIGN KEY (empresa_id) REFERENCES empresa (id)
    )
  `);

  // Insertar datos empresa
  const empresaStmt = db.prepare(`
    INSERT OR IGNORE INTO empresa (id, nombre, nit, direccion, ciudad, telefono, cupo_base_clientes_nuevos, factor_holgura, dias_evaluacion_promedio) 
    VALUES (1, 'JK Carburantes', '123456789', 'Av. Principal', 'La Paz', '77712345', 50, 0.10, 28)
  `);
  empresaStmt.run();

  // Insertar tanques semilla
  const tanqueStmt = db.prepare(`
    INSERT OR IGNORE INTO tanques (id, empresa_id, identificador, tipo_carburante, capacidad_maxima, stock_minimo, stock_actual) 
    VALUES 
      (1, 1, 'T-01', 'Gasolina', 10000, 1000, 8500),
      (2, 1, 'T-02', 'Diesel', 15000, 1500, 12000)
  `);
  tanqueStmt.run();

  // Insertar clientes semilla
  const clienteStmt = db.prepare(`
    INSERT OR IGNORE INTO clientes (id, empresa_id, documento, nombre, placa_vehiculo, tipo_cliente, estado, primera_compra) 
    VALUES 
      (1, 1, '123456', 'Juan Perez', 'ABC-123', 'Particular', 'Activo', datetime('now', '-30 days')),
      (2, 1, '987654', 'Maria Lopez', 'XYZ-987', 'Transporte_Publico', 'Activo', datetime('now', '-60 days'))
  `);
  clienteStmt.run();

  // Insertar ventas base
  const ventasStmt = db.prepare(`
    INSERT OR IGNORE INTO ventas (id, cliente_id, tanque_id, empresa_id, cantidad_solicitada, cantidad_autorizada, fue_limitada, promedio_semanal_cliente, limite_permitido, fecha_hora, estado)
    VALUES
      (1, 1, 1, 1, 100, 100, 0, 50, 55, datetime('now', '-25 days'), 'Completada'),
      (2, 1, 1, 1, 150, 150, 0, 100, 110, datetime('now', '-18 days'), 'Completada'),
      (3, 1, 1, 1, 120, 120, 0, 125, 137.5, datetime('now', '-11 days'), 'Completada'),
      (4, 1, 1, 1, 80, 80, 0, 123, 135, datetime('now', '-4 days'), 'Completada')
  `);
  ventasStmt.run();

  console.log("Base de datos inicializada correctamente.");
} catch (err) {
  console.error("Error al inicializar la base de datos:", err);
}
