// ─── UTILIDADES GLOBALES ──────────────────────────────
const utils = {
  formatDate: (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  formatDateShort: (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('es-BO');
  },

  formatNumber: (num, decimals = 2) => {
    if (num === null || num === undefined) return '—';
    return Number(num).toLocaleString('es-BO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Show a toast notification
   * @param {string} msg  - Message to display
   * @param {'success'|'error'|'info'} type - Toast type
   */
  toast: (msg, type = 'info') => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 350);
    }, 3500);
  },

  showModal: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hide');
  },

  hideModal: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hide');
  },

  setLoading: (btn, loading) => {
    if (!btn) return;
    if (loading) {
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.origText || btn.innerHTML;
      btn.disabled = false;
    }
  }
};
