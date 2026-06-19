// ═══════════════════════════════════════════════════════════
//  JK CARBURANTES — Frontend App
//  Módulos: Dashboard | Nueva Venta | Ingresos | Clientes | Config
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', initApp);

// ── ESTADO GLOBAL ──────────────────────────────────────────
const state = {
  tanques: [],
  clienteActual: null,
  limiteActual: 0,
  editingClienteId: null,
  editingTanqueId: null,
};

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
async function initApp() {
  bindNavigation();
  bindDashboard();
  bindNuevaVenta();
  bindIngresos();
  bindClientes();
  bindConfig();
  bindModals();

  await loadDashboard();
}

// ══════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════
function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const target = e.currentTarget.getAttribute('data-target');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
      document.getElementById(target).classList.add('active-view');

      // Lazy load on navigate
      if (target === 'dashboard')    await loadDashboard();
      if (target === 'nueva-venta')  await prepNuevaVenta();
      if (target === 'ingresos')     await prepIngresos();
      if (target === 'clientes')     await loadClientes();
      if (target === 'config')       await loadConfig();
    });
  });

  // Config tabs
  document.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.config-sub-panel').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      document.getElementById(e.currentTarget.dataset.tab).classList.add('active');
      if (e.currentTarget.dataset.tab === 'config-tanques') loadTanquesConfig();
    });
  });
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function bindDashboard() {
  document.getElementById('btn-refresh-dash').addEventListener('click', loadDashboard);
}

async function loadDashboard() {
  try {
    const [stats, ventas] = await Promise.all([
      api.getEstadisticas(),
      api.getReporte()
    ]);

    state.tanques = stats.tanques || [];

    // Stats cards
    document.getElementById('stat-ventas-hoy').textContent  = stats.ventas_hoy ?? '0';
    document.getElementById('stat-litros-hoy').textContent  = `${utils.formatNumber(stats.litros_hoy)} L hoy`;
    document.getElementById('stat-litros-total').textContent = `${utils.formatNumber(stats.total_litros_vendidos)} L`;
    document.getElementById('stat-ventas-total').textContent = `${stats.total_ventas} ventas registradas`;
    document.getElementById('stat-clientes').textContent    = stats.total_clientes ?? '0';
    document.getElementById('stat-suspendidos').textContent = `${stats.clientes_suspendidos} suspendidos`;

    renderTanques(state.tanques, 'tanques-container');
    renderVentasTable(ventas.slice(0, 15));

  } catch (err) {
    utils.toast('Error al cargar el dashboard', 'error');
    console.error(err);
  }
}

function renderTanques(tanques, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!tanques.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛢️</div><p>No hay tanques registrados</p></div>`;
    return;
  }

  container.innerHTML = tanques.map(t => {
    const pct = Math.min(Math.round((t.stock_actual / t.capacidad_maxima) * 100), 100);
    const level = pct <= 20 ? 'low' : pct <= 50 ? 'medium' : '';
    const isLow = t.stock_actual <= t.stock_minimo;
    const typeClass = t.tipo_carburante === 'Gasolina' ? 'gasolina' : 'diesel';

    return `
      <div class="tank-card">
        <div class="tank-header">
          <span class="tank-title">${t.identificador}</span>
          <span class="tank-type-badge ${typeClass}">${t.tipo_carburante}</span>
        </div>
        <div class="tank-percent" style="color: ${level === 'low' ? 'var(--danger)' : level === 'medium' ? 'var(--warning)' : 'var(--success)'}">${pct}%</div>
        <div class="progress-track">
          <div class="progress-fill ${level}" style="width:${pct}%"></div>
        </div>
        <div class="tank-stats">
          <span>🟢 ${utils.formatNumber(t.stock_actual)} L actuales</span>
          <span>Max: ${utils.formatNumber(t.capacidad_maxima)} L</span>
        </div>
        ${isLow ? `<div class="tank-alert-badge">⚠️ STOCK BAJO</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderVentasTable(ventas) {
  const tbody = document.getElementById('tbody-ventas');
  if (!ventas.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><p>Sin ventas registradas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = ventas.map(v => `
    <tr>
      <td class="text-small">${utils.formatDate(v.fecha_hora)}</td>
      <td><strong>${v.cliente_nombre || '—'}</strong><br><span class="text-muted text-small">${v.cliente_id}</span></td>
      <td>${v.placa_vehiculo || '—'}</td>
      <td><span class="badge ${v.tipo_carburante === 'Gasolina' ? 'badge-info' : 'badge-warning'}">${v.tipo_carburante}</span></td>
      <td><strong>${utils.formatNumber(v.cantidad_autorizada)}</strong> L</td>
      <td>${v.fue_limitada ? '<span class="badge badge-danger">Limitada</span>' : '<span class="badge badge-success">Normal</span>'}</td>
      <td><span class="badge ${v.estado === 'Completada' ? 'badge-success' : 'badge-danger'}">${v.estado}</span></td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════════════
//  NUEVA VENTA
// ══════════════════════════════════════════════════════════
async function prepNuevaVenta() {
  if (!state.tanques.length) state.tanques = await api.getTanques();
  const select = document.getElementById('select-tanque');
  select.innerHTML = '<option value="">— Seleccionar tanque —</option>';
  state.tanques.forEach(t => {
    select.innerHTML += `<option value="${t.id}" data-stock="${t.stock_actual}">${t.identificador} (${t.tipo_carburante}) — ${utils.formatNumber(t.stock_actual)} L disponibles</option>`;
  });
}

function bindNuevaVenta() {
  const inputDoc    = document.getElementById('buscar-documento');
  const btnBuscar   = document.getElementById('btn-buscar');
  const inputCant   = document.getElementById('input-cantidad');
  const selectTanq  = document.getElementById('select-tanque');
  const btnLimpiar  = document.getElementById('btn-limpiar');
  const formVenta   = document.getElementById('form-venta');

  // Buscar cliente (Enter)
  inputDoc.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnBuscar.click(); });

  btnBuscar.addEventListener('click', async () => {
    const query = inputDoc.value.trim();
    if (!query) { utils.toast('Ingrese un documento o placa', 'error'); return; }

    utils.setLoading(btnBuscar, true);
    try {
      const res = await api.validarCupo(query, 0, '');

      // Si hay error de servidor
      if (res.error && !res.cliente_info) {
        // Mostrar formulario de registro rápido
        document.getElementById('registro-nuevo-cliente').classList.remove('hide');
        document.getElementById('nuevo-placa').value = query.includes('-') ? query : '';
        document.getElementById('cliente-info').classList.add('hide');
        utils.toast('Cliente no encontrado. Regístrelo primero.', 'info');
        return;
      }

      document.getElementById('registro-nuevo-cliente').classList.add('hide');
      mostrarInfoCliente(res);
    } catch (err) {
      utils.toast('Error de conexión', 'error');
    } finally {
      utils.setLoading(btnBuscar, false);
    }
  });

  // Registro rápido
  document.getElementById('btn-registrar-rapido').addEventListener('click', async () => {
    const documento = document.getElementById('buscar-documento').value.trim();
    const nombre    = document.getElementById('nuevo-nombre').value.trim();
    const placa     = document.getElementById('nuevo-placa').value.trim();
    const tipo      = document.getElementById('nuevo-tipo').value;
    if (!documento || !nombre) { utils.toast('Documento y nombre son requeridos', 'error'); return; }

    const res = await api.crearCliente({ documento, nombre, placa_vehiculo: placa, tipo_cliente: tipo });
    if (res.error) { utils.toast(res.error, 'error'); return; }

    utils.toast('Cliente registrado exitosamente', 'success');
    document.getElementById('registro-nuevo-cliente').classList.add('hide');
    // Validar cupo del nuevo cliente
    const cupoRes = await api.validarCupo(documento, 0, '');
    mostrarInfoCliente(cupoRes);
  });

  // Cambio en cantidad
  inputCant.addEventListener('input', () => {
    updateCupoMeter();
    updateSubmitState();
    updateResumen();
  });

  // Cambio en tanque
  selectTanq.addEventListener('change', () => {
    updateSubmitState();
    updateResumen();
  });

  // Procesar venta
  formVenta.addEventListener('submit', async () => {
    if (!state.clienteActual) { utils.toast('Busque un cliente primero', 'error'); return; }
    const tanqueId = selectTanq.value;
    const cantidad = parseFloat(inputCant.value);
    if (!tanqueId) { utils.toast('Seleccione un tanque', 'error'); return; }
    if (!cantidad || cantidad <= 0) { utils.toast('Ingrese una cantidad válida', 'error'); return; }

    const btnProcesar = document.getElementById('btn-procesar');
    utils.setLoading(btnProcesar, true);

    try {
      const res = await api.procesarVenta(state.clienteActual.id, tanqueId, cantidad);
      if (res.error) { utils.toast(res.error, 'error'); return; }

      mostrarRecibo(res.comprobante);
      limpiarVenta();
      // Recargar tanques
      state.tanques = await api.getTanques();
      await prepNuevaVenta();
      utils.toast('Venta procesada con éxito', 'success');
    } catch (err) {
      utils.toast('Error al procesar la venta', 'error');
    } finally {
      utils.setLoading(btnProcesar, false);
    }
  });

  btnLimpiar.addEventListener('click', limpiarVenta);
}

function mostrarInfoCliente(res) {
  const cliente = res.cliente_info;
  state.clienteActual = cliente;
  state.limiteActual  = res.limite_permitido;

  const cardEl = document.getElementById('cliente-info');
  cardEl.classList.remove('hide');

  const suspendido = cliente.estado === 'Suspendido';
  document.getElementById('info-estado').innerHTML =
    `<span class="badge ${suspendido ? 'badge-danger' : 'badge-success'}">${cliente.estado}</span>`;
  document.getElementById('info-nombre').textContent    = cliente.nombre || '—';
  document.getElementById('info-documento').textContent = cliente.documento;
  document.getElementById('info-placa').textContent     = cliente.placa_vehiculo || '—';
  document.getElementById('info-tipo').textContent      = cliente.tipo_cliente || '—';
  document.getElementById('info-promedio').textContent  = `${utils.formatNumber(res.promedio_semanal)} L`;
  document.getElementById('info-limite').textContent    = `${utils.formatNumber(res.limite_permitido)} L`;
  document.getElementById('quota-tip').textContent      = `Máx: ${utils.formatNumber(res.limite_permitido)} L`;

  document.getElementById('input-cantidad').disabled = suspendido;
  if (suspendido) {
    utils.toast('Cliente suspendido. No puede realizar ventas.', 'error');
  }
  updateCupoMeter();
  updateSubmitState();
}

function updateCupoMeter() {
  const cantidad = parseFloat(document.getElementById('input-cantidad').value) || 0;
  const pct = state.limiteActual > 0 ? Math.min((cantidad / state.limiteActual) * 100, 110) : 0;
  const fill = document.getElementById('quota-fill');
  fill.style.width = `${Math.min(pct, 100)}%`;
  fill.className = `quota-fill${pct > 100 ? ' over' : ''}`;
}

function updateSubmitState() {
  const cantidad   = parseFloat(document.getElementById('input-cantidad').value) || 0;
  const tanqueId   = document.getElementById('select-tanque').value;
  const alertCupo  = document.getElementById('alerta-cupo');
  const alertStock = document.getElementById('alerta-stock');
  const btnProc    = document.getElementById('btn-procesar');

  let canSubmit = !!state.clienteActual && !!tanqueId && cantidad > 0;

  // Check cupo
  if (cantidad > state.limiteActual && state.limiteActual > 0) {
    alertCupo.classList.remove('hide');
    document.getElementById('alert-max').textContent = utils.formatNumber(state.limiteActual);
    canSubmit = false;
  } else {
    alertCupo.classList.add('hide');
  }

  // Check stock
  if (tanqueId) {
    const selectedOption = document.querySelector(`#select-tanque option[value="${tanqueId}"]`);
    const stockDisp = parseFloat(selectedOption?.dataset.stock || 99999);
    if (cantidad > stockDisp) {
      alertStock.classList.remove('hide');
      canSubmit = false;
    } else {
      alertStock.classList.add('hide');
    }
  }

  btnProc.disabled = !canSubmit || state.clienteActual?.estado === 'Suspendido';
}

function updateResumen() {
  const cantidad  = parseFloat(document.getElementById('input-cantidad').value) || 0;
  const tanqueId  = document.getElementById('select-tanque').value;
  const resumen   = document.getElementById('resumen-despacho');

  if (!tanqueId || cantidad <= 0 || !state.clienteActual) {
    resumen.classList.add('hide');
    return;
  }

  const opt = document.querySelector(`#select-tanque option[value="${tanqueId}"]`);
  const text = opt ? opt.textContent : '—';

  resumen.classList.remove('hide');
  document.getElementById('rsm-carb').textContent   = text.split('(')[1]?.split(')')[0] || '—';
  document.getElementById('rsm-litros').textContent = `${utils.formatNumber(cantidad)} L`;
  document.getElementById('rsm-cupo').textContent   = `${utils.formatNumber(state.limiteActual - cantidad)} L restante`;
}

function limpiarVenta() {
  state.clienteActual = null;
  state.limiteActual  = 0;
  document.getElementById('buscar-documento').value = '';
  document.getElementById('cliente-info').classList.add('hide');
  document.getElementById('registro-nuevo-cliente').classList.add('hide');
  document.getElementById('input-cantidad').value = '';
  document.getElementById('input-cantidad').disabled = true;
  document.getElementById('btn-procesar').disabled = true;
  document.getElementById('alerta-cupo').classList.add('hide');
  document.getElementById('alerta-stock').classList.add('hide');
  document.getElementById('select-tanque').value = '';
  document.getElementById('resumen-despacho').classList.add('hide');
  document.getElementById('quota-fill').style.width = '0%';
}

function mostrarRecibo(comp) {
  document.getElementById('receipt-rows').innerHTML = `
    <div class="receipt-row"><span>Fecha:</span><span>${utils.formatDate(comp.fecha)}</span></div>
    <div class="receipt-row"><span>Cliente:</span><strong>${comp.cliente}</strong></div>
    <div class="receipt-row"><span>Documento:</span><span>${comp.documento}</span></div>
    <div class="receipt-row"><span>Placa:</span><span>${comp.placa || '—'}</span></div>
    <div class="receipt-row"><span>Carburante:</span><span>${comp.tipo_carburante}</span></div>
    <div class="receipt-row"><span>Cupo autorizado:</span><span>${utils.formatNumber(comp.limite_disponible)} L</span></div>
  `;
  document.getElementById('receipt-total').textContent = `${utils.formatNumber(comp.cantidad_despachada)} L`;
  document.getElementById('receipt-footer-date').textContent = new Date().toLocaleString('es-BO');
  utils.showModal('modal-recibo');
}

// ══════════════════════════════════════════════════════════
//  INGRESOS
// ══════════════════════════════════════════════════════════
async function prepIngresos() {
  if (!state.tanques.length) state.tanques = await api.getTanques();
  const select = document.getElementById('select-tanque-ingreso');
  select.innerHTML = state.tanques.map(t =>
    `<option value="${t.id}">${t.identificador} (${t.tipo_carburante}) — ${utils.formatNumber(t.stock_actual)} L</option>`
  ).join('');
  loadHistorialIngresos();
}

async function loadHistorialIngresos() {
  try {
    const ingresos = await api.getIngresos();
    const tbody = document.getElementById('tbody-ingresos');
    if (!ingresos.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem">Sin ingresos aún</td></tr>`;
      return;
    }
    tbody.innerHTML = ingresos.map(i => `
      <tr>
        <td class="text-small">${utils.formatDate(i.fecha_hora)}</td>
        <td>${i.tanque_identificador || i.tanque_id}</td>
        <td><strong>+${utils.formatNumber(i.cantidad_litros)}</strong> L</td>
        <td class="text-small text-muted">${i.numero_factura_proveedor}</td>
      </tr>
    `).join('');
  } catch (_) {}
}

function bindIngresos() {
  document.getElementById('form-ingreso').addEventListener('submit', async () => {
    const tanque_id = document.getElementById('select-tanque-ingreso').value;
    const factura   = document.getElementById('ingreso-factura').value.trim();
    const cantidad  = parseFloat(document.getElementById('ingreso-cantidad').value);
    const obs       = document.getElementById('ingreso-observaciones').value.trim();

    if (!factura || !cantidad) { utils.toast('Factura y cantidad son requeridos', 'error'); return; }

    const btn = document.querySelector('#form-ingreso button[type="submit"]');
    utils.setLoading(btn, true);

    try {
      const res = await api.registrarIngreso({ tanque_id, empresa_id: 1, cantidad_litros: cantidad, numero_factura_proveedor: factura, observaciones: obs });
      if (res.error) { utils.toast(res.error, 'error'); return; }

      utils.toast('Ingreso registrado correctamente', 'success');
      document.getElementById('form-ingreso').reset();
      state.tanques = await api.getTanques();
      await prepIngresos();
    } catch (err) {
      utils.toast('Error al registrar ingreso', 'error');
    } finally {
      utils.setLoading(btn, false);
    }
  });
}

// ══════════════════════════════════════════════════════════
//  CLIENTES
// ══════════════════════════════════════════════════════════
async function loadClientes(params = {}) {
  const search = document.getElementById('search-clientes').value.trim();
  const estado = document.getElementById('filter-estado-cliente').value;
  const qp = {};
  if (search) qp.search = search;
  if (estado) qp.estado = estado; // handled client-side for now

  try {
    let clientes = await api.getClientes(search ? { search } : {});
    if (estado) clientes = clientes.filter(c => c.estado === estado);
    renderClientesTable(clientes);
  } catch (err) {
    utils.toast('Error al cargar clientes', 'error');
  }
}

function renderClientesTable(clientes) {
  const tbody = document.getElementById('tbody-clientes');
  if (!clientes.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><p>No se encontraron clientes</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td><strong>${c.documento}</strong></td>
      <td>${c.nombre || '—'}</td>
      <td>${c.placa_vehiculo || '—'}</td>
      <td><span class="badge badge-info">${(c.tipo_cliente || '').replace('_', ' ')}</span></td>
      <td><span class="badge ${c.estado === 'Activo' ? 'badge-success' : 'badge-danger'}">${c.estado}</span></td>
      <td class="text-small text-muted">${utils.formatDateShort(c.primera_compra)}</td>
      <td>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-sm btn-icon" title="Ver historial" onclick="abrirHistorial(${c.id}, '${c.nombre}')">📋</button>
          <button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="editarCliente(${c.id})">✏️</button>
          <button class="btn btn-sm ${c.estado === 'Activo' ? 'btn-danger' : 'btn-success'} btn-icon" 
            title="${c.estado === 'Activo' ? 'Suspender' : 'Activar'}"
            onclick="toggleEstadoCliente(${c.id}, '${c.estado}')">
            ${c.estado === 'Activo' ? '🚫' : '✅'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function bindClientes() {
  document.getElementById('btn-buscar-clientes').addEventListener('click', loadClientes);
  document.getElementById('search-clientes').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadClientes();
  });
  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
    state.editingClienteId = null;
    document.getElementById('modal-cliente-title').textContent = 'Nuevo Cliente';
    document.getElementById('mc-documento').value = '';
    document.getElementById('mc-nombre').value = '';
    document.getElementById('mc-placa').value = '';
    document.getElementById('mc-tipo').value = 'Particular';
    document.getElementById('mc-estado').value = 'Activo';
    document.getElementById('mc-documento').disabled = false;
    document.getElementById('mc-estado-group').style.display = 'none';
    utils.showModal('modal-cliente');
  });
}

async function editarCliente(id) {
  const clientes = await api.getClientes();
  const c = clientes.find(x => x.id === id);
  if (!c) return;

  state.editingClienteId = id;
  document.getElementById('modal-cliente-title').textContent = 'Editar Cliente';
  document.getElementById('mc-documento').value = c.documento;
  document.getElementById('mc-nombre').value    = c.nombre || '';
  document.getElementById('mc-placa').value     = c.placa_vehiculo || '';
  document.getElementById('mc-tipo').value      = c.tipo_cliente || 'Particular';
  document.getElementById('mc-estado').value    = c.estado;
  document.getElementById('mc-documento').disabled = true;
  document.getElementById('mc-estado-group').style.display = '';
  utils.showModal('modal-cliente');
}

async function toggleEstadoCliente(id, estadoActual) {
  const nuevoEstado = estadoActual === 'Activo' ? 'Suspendido' : 'Activo';
  const res = await api.cambiarEstadoCliente(id, nuevoEstado);
  if (res.error) { utils.toast(res.error, 'error'); return; }
  utils.toast(`Cliente ${nuevoEstado.toLowerCase()} correctamente`, 'success');
  loadClientes();
}

async function abrirHistorial(id, nombre) {
  document.getElementById('historial-cliente-nombre').textContent = nombre || `#${id}`;
  document.getElementById('tbody-historial').innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:1.5rem">Cargando...</td></tr>`;
  utils.showModal('modal-historial');

  try {
    const historial = await api.getHistorialCliente(id);
    const tbody = document.getElementById('tbody-historial');
    if (!historial.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:1.5rem">Sin compras registradas</td></tr>`;
      return;
    }
    tbody.innerHTML = historial.map(v => `
      <tr>
        <td class="text-small">${utils.formatDate(v.fecha_hora)}</td>
        <td>${v.tanque_identificador || '—'}</td>
        <td><span class="badge ${v.tipo_carburante === 'Gasolina' ? 'badge-info' : 'badge-warning'}">${v.tipo_carburante}</span></td>
        <td><strong>${utils.formatNumber(v.cantidad_autorizada)} L</strong></td>
        <td>${utils.formatNumber(v.limite_permitido)} L</td>
        <td>${v.fue_limitada ? '<span class="badge badge-danger">Sí</span>' : '<span class="badge badge-success">No</span>'}</td>
        <td><span class="badge badge-success">${v.estado}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    utils.toast('Error al cargar historial', 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════════════════════════
async function loadConfig() {
  try {
    const emp = await api.getEmpresa();
    document.getElementById('emp-nombre').value    = emp.nombre || '';
    document.getElementById('emp-nit').value       = emp.nit || '';
    document.getElementById('emp-direccion').value = emp.direccion || '';
    document.getElementById('emp-ciudad').value    = emp.ciudad || '';
    document.getElementById('emp-telefono').value  = emp.telefono || '';
    document.getElementById('emp-cupo-base').value = emp.cupo_base_clientes_nuevos || '';
    document.getElementById('emp-factor').value    = emp.factor_holgura || '';
    document.getElementById('emp-dias').value      = emp.dias_evaluacion_promedio || '';
  } catch (err) {
    utils.toast('Error al cargar configuración', 'error');
  }
}

async function loadTanquesConfig() {
  try {
    const tanques = await api.getTanques();
    const tbody = document.getElementById('tbody-tanques-config');
    if (!tanques.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:2rem">Sin tanques</td></tr>`;
      return;
    }
    tbody.innerHTML = tanques.map(t => {
      const pct = Math.round((t.stock_actual / t.capacidad_maxima) * 100);
      const isLow = t.stock_actual <= t.stock_minimo;
      return `
        <tr>
          <td><strong>${t.identificador}</strong></td>
          <td><span class="badge ${t.tipo_carburante === 'Gasolina' ? 'badge-info' : 'badge-warning'}">${t.tipo_carburante}</span></td>
          <td>${utils.formatNumber(t.capacidad_maxima)} L</td>
          <td>${utils.formatNumber(t.stock_minimo)} L</td>
          <td class="${isLow ? 'text-small' : ''}" style="color:${isLow ? 'var(--danger)' : 'inherit'}">${utils.formatNumber(t.stock_actual)} L ${isLow ? '⚠️' : ''}</td>
          <td style="width:120px">
            <div class="progress-track" style="height:6px">
              <div class="progress-fill ${pct <= 20 ? 'low' : pct <= 50 ? 'medium' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="text-small text-muted">${pct}%</div>
          </td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="editarTanque(${t.id})">✏️</button>
              <button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="eliminarTanque(${t.id}, '${t.identificador}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    utils.toast('Error al cargar tanques', 'error');
  }
}

function bindConfig() {
  document.getElementById('form-empresa').addEventListener('submit', async () => {
    const data = {
      nombre: document.getElementById('emp-nombre').value,
      nit: document.getElementById('emp-nit').value,
      direccion: document.getElementById('emp-direccion').value,
      ciudad: document.getElementById('emp-ciudad').value,
      telefono: document.getElementById('emp-telefono').value,
      cupo_base_clientes_nuevos: parseFloat(document.getElementById('emp-cupo-base').value),
      factor_holgura: parseFloat(document.getElementById('emp-factor').value),
      dias_evaluacion_promedio: parseInt(document.getElementById('emp-dias').value),
    };
    const btn = document.querySelector('#form-empresa button[type="submit"]');
    utils.setLoading(btn, true);
    try {
      const res = await api.actualizarEmpresa(data);
      if (res.error) { utils.toast(res.error, 'error'); return; }
      utils.toast('Configuración guardada correctamente', 'success');
    } finally {
      utils.setLoading(btn, false);
    }
  });

  document.getElementById('btn-nuevo-tanque').addEventListener('click', () => {
    state.editingTanqueId = null;
    document.getElementById('modal-tanque-title').textContent = 'Nuevo Tanque';
    document.getElementById('mt-identificador').value = '';
    document.getElementById('mt-tipo').value = 'Gasolina';
    document.getElementById('mt-capacidad').value = '';
    document.getElementById('mt-stock-min').value = '';
    document.getElementById('mt-stock-actual').value = '';
    document.getElementById('mt-stock-actual-group').style.display = '';
    utils.showModal('modal-tanque');
  });
}

async function editarTanque(id) {
  const tanques = await api.getTanques();
  const t = tanques.find(x => x.id === id);
  if (!t) return;

  state.editingTanqueId = id;
  document.getElementById('modal-tanque-title').textContent = `Editar Tanque — ${t.identificador}`;
  document.getElementById('mt-identificador').value = t.identificador;
  document.getElementById('mt-tipo').value = t.tipo_carburante;
  document.getElementById('mt-capacidad').value = t.capacidad_maxima;
  document.getElementById('mt-stock-min').value = t.stock_minimo;
  document.getElementById('mt-stock-actual-group').style.display = 'none';
  utils.showModal('modal-tanque');
}

async function eliminarTanque(id, nombre) {
  if (!confirm(`¿Eliminar el tanque "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const res = await api.eliminarTanque(id);
  if (res.error) { utils.toast(res.error, 'error'); return; }
  utils.toast('Tanque eliminado', 'success');
  state.tanques = await api.getTanques();
  loadTanquesConfig();
}

// ══════════════════════════════════════════════════════════
//  MODALES (Global bindings)
// ══════════════════════════════════════════════════════════
function bindModals() {
  // Recibo
  document.getElementById('btn-cerrar-recibo').addEventListener('click', () => utils.hideModal('modal-recibo'));
  document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

  // Historial
  document.getElementById('close-modal-historial').addEventListener('click', () => utils.hideModal('modal-historial'));
  document.getElementById('close-modal-historial-btn').addEventListener('click', () => utils.hideModal('modal-historial'));

  // Cliente modal
  document.getElementById('close-modal-cliente').addEventListener('click', () => utils.hideModal('modal-cliente'));
  document.getElementById('cancel-modal-cliente').addEventListener('click', () => utils.hideModal('modal-cliente'));
  document.getElementById('save-modal-cliente').addEventListener('click', async () => {
    const documento = document.getElementById('mc-documento').value.trim();
    const nombre    = document.getElementById('mc-nombre').value.trim();
    const placa     = document.getElementById('mc-placa').value.trim();
    const tipo      = document.getElementById('mc-tipo').value;
    const estado    = document.getElementById('mc-estado').value;

    if (!documento || !nombre) { utils.toast('Documento y nombre son requeridos', 'error'); return; }

    const btn = document.getElementById('save-modal-cliente');
    utils.setLoading(btn, true);
    try {
      let res;
      if (state.editingClienteId) {
        res = await api.actualizarCliente(state.editingClienteId, { nombre, placa_vehiculo: placa, tipo_cliente: tipo, estado });
      } else {
        res = await api.crearCliente({ documento, nombre, placa_vehiculo: placa, tipo_cliente: tipo });
      }
      if (res.error) { utils.toast(res.error, 'error'); return; }
      utils.toast(state.editingClienteId ? 'Cliente actualizado' : 'Cliente creado', 'success');
      utils.hideModal('modal-cliente');
      loadClientes();
    } finally {
      utils.setLoading(btn, false);
    }
  });

  // Tanque modal
  document.getElementById('close-modal-tanque').addEventListener('click', () => utils.hideModal('modal-tanque'));
  document.getElementById('cancel-modal-tanque').addEventListener('click', () => utils.hideModal('modal-tanque'));
  document.getElementById('save-modal-tanque').addEventListener('click', async () => {
    const identificador = document.getElementById('mt-identificador').value.trim();
    const tipo          = document.getElementById('mt-tipo').value;
    const capacidad     = parseFloat(document.getElementById('mt-capacidad').value);
    const stockMin      = parseFloat(document.getElementById('mt-stock-min').value);
    const stockActual   = parseFloat(document.getElementById('mt-stock-actual').value) || 0;

    if (!identificador || !capacidad) { utils.toast('Todos los campos son requeridos', 'error'); return; }

    const btn = document.getElementById('save-modal-tanque');
    utils.setLoading(btn, true);
    try {
      let res;
      if (state.editingTanqueId) {
        res = await api.actualizarTanque(state.editingTanqueId, { identificador, tipo_carburante: tipo, capacidad_maxima: capacidad, stock_minimo: stockMin });
      } else {
        res = await api.crearTanque({ identificador, tipo_carburante: tipo, capacidad_maxima: capacidad, stock_minimo: stockMin, stock_actual: stockActual });
      }
      if (res.error) { utils.toast(res.error, 'error'); return; }
      utils.toast(state.editingTanqueId ? 'Tanque actualizado' : 'Tanque creado', 'success');
      utils.hideModal('modal-tanque');
      state.tanques = await api.getTanques();
      loadTanquesConfig();
    } finally {
      utils.setLoading(btn, false);
    }
  });

  // Close backdrop on click outside
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hide');
    });
  });
}
