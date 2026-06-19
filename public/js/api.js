const BASE = '/api';

const api = {
  // ─── EMPRESA ─────────────────────────────────
  getEmpresa: () => fetch(`${BASE}/empresa`).then(r => r.json()),
  getEstadisticas: () => fetch(`${BASE}/empresa/estadisticas`).then(r => r.json()),
  actualizarEmpresa: (data) => fetch(`${BASE}/empresa/actualizar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // ─── TANQUES ─────────────────────────────────
  getTanques: () => fetch(`${BASE}/tanques`).then(r => r.json()),
  crearTanque: (data) => fetch(`${BASE}/tanques/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  actualizarTanque: (id, data) => fetch(`${BASE}/tanques/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  eliminarTanque: (id) => fetch(`${BASE}/tanques/${id}`, {
    method: 'DELETE'
  }).then(r => r.json()),

  // ─── CLIENTES ────────────────────────────────
  getClientes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/clientes${q ? '?' + q : ''}`).then(r => r.json());
  },
  crearCliente: (data) => fetch(`${BASE}/clientes/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  actualizarCliente: (id, data) => fetch(`${BASE}/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  cambiarEstadoCliente: (id, estado) => fetch(`${BASE}/clientes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  }).then(r => r.json()),
  getHistorialCliente: (id) => fetch(`${BASE}/clientes/${id}/historial`).then(r => r.json()),

  // ─── VENTAS ──────────────────────────────────
  validarCupo: (cliente_identificador, cantidad_solicitada, tipo_carburante) =>
    fetch(`${BASE}/ventas/validar-cupo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_identificador, cantidad_solicitada, tipo_carburante })
    }).then(r => r.json()),

  procesarVenta: (cliente_id, tanque_id, cantidad_autorizada) =>
    fetch(`${BASE}/ventas/procesar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id, tanque_id, cantidad_autorizada })
    }).then(r => r.json()),

  getReporte: () => fetch(`${BASE}/ventas/reporte`).then(r => r.json()),

  // ─── INGRESOS ────────────────────────────────
  registrarIngreso: (data) => fetch(`${BASE}/ingresos/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getIngresos: () => fetch(`${BASE}/ingresos`).then(r => r.json())
};
