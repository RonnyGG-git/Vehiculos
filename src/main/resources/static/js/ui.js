/**
 * Utilidades de UI: construcción de DOM, formateo, modales, toasts y formularios.
 */
import { ApiError } from './api.js';

/* ---------- DOM ---------- */

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

export function icon(name) {
  const paths = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
}

/* ---------- Formateo ---------- */

const copFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const copFmtDec = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtCOP(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isInteger(n) ? copFmt.format(n) : copFmtDec.format(n);
}

export function fmtUSD(value) {
  if (value === null || value === undefined || value === '') return '—';
  return usdFmt.format(Number(value));
}

export function fmtFechaHora(value) {
  if (!value) return '—';
  const [date, time = ''] = String(value).split('T');
  return time ? `${date} ${time.slice(0, 5)}` : date;
}

export function fmtFecha(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

export function hoyISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function esc(texto) {
  const div = document.createElement('div');
  div.textContent = texto === null || texto === undefined ? '' : String(texto);
  return div.innerHTML;
}

/* ---------- Badges ---------- */

export function estadoBadge(estado) {
  const map = {
    DISPONIBLE: 'success',
    VENDIDO: 'danger',
    EN_MANTENIMIENTO: 'warning',
  };
  const label = {
    DISPONIBLE: 'Disponible',
    VENDIDO: 'Vendido',
    EN_MANTENIMIENTO: 'En mantenimiento',
  };
  return h('span', { class: `badge ${map[estado] || 'neutral'}` }, label[estado] || estado || '—');
}

/* ---------- Estados de carga / vacío / error ---------- */

export function spinner() {
  return h('div', { class: 'spinner', role: 'status', 'aria-label': 'Cargando' });
}

export function emptyState(titulo, desc) {
  return h('div', { class: 'state-block' },
    h('span', { html: icon('inbox'), class: 'state-icon' }),
    h('div', { class: 'state-title' }, titulo),
    desc ? h('div', { class: 'state-desc' }, desc) : null);
}

export function errorState(error, onRetry) {
  const esRed = error instanceof ApiError && error.isNetwork;
  const detalles = error instanceof ApiError && error.details.length ? error.details : null;
  return h('div', { class: 'state-block' },
    h('span', { html: icon('alert'), style: 'color: var(--danger)' }),
    h('div', { class: 'state-title' }, esRed ? 'Error de conexión' : 'No se pudo cargar la información'),
    h('div', { class: 'state-desc' }, error.message || String(error)),
    detalles ? h('ul', { class: 'toast-details', style: 'list-style: disc; display: inline-block; text-align: left;' },
      detalles.map(d => h('li', {}, d))) : null,
    onRetry ? h('button', { class: 'btn btn-ghost', onclick: onRetry }, 'Reintentar') : null);
}

/* ---------- Toast ---------- */

export function toast(tipo, mensaje, detalles = []) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const iconName = tipo === 'success' ? 'check' : tipo === 'warning' || tipo === 'error' ? 'alert' : 'info';
  const titulos = { success: 'Listo', error: 'Error', warning: 'Atención', info: 'Información' };

  const el = h('div', { class: `toast ${tipo}` },
    h('span', { class: 'toast-icon', html: icon(iconName) }),
    h('div', { class: 'toast-content' },
      h('div', { class: 'toast-title' }, titulos[tipo] || 'Aviso'),
      h('div', { class: 'toast-msg' }, mensaje),
      detalles && detalles.length ? h('ul', { class: 'toast-details' }, detalles.map(d => h('li', {}, d))) : null),
    h('button', { class: 'toast-close', 'aria-label': 'Cerrar', html: icon('x'), onclick: () => cerrar() }));

  const cerrar = () => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  root.append(el);
  setTimeout(cerrar, tipo === 'error' ? 8000 : 4500);
}

/** Muestra un toast con el mensaje de error (y detalles de validación) devuelto por la API. */
export function manejarError(error, contexto, form = null) {
  if (error instanceof ApiError) {
    if (form && error.details.length) form.showApiErrors(error.details);
    if (error.isNetwork) {
      toast('error', 'No hay conexión con la API. ¿Está corriendo el servidor en el puerto 8080?');
    } else {
      toast('error', `${contexto}: ${error.message}`, error.details);
    }
  } else {
    toast('error', `${contexto}: ${error.message || error}`);
  }
}

/* ---------- Modal ---------- */

export function openModal({ title, content, actions = [], large = false, onClose = null }) {
  const root = document.getElementById('modal-root');

  const closeModal = () => {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    if (onClose) onClose();
  };

  const onKey = (e) => { if (e.key === 'Escape') closeModal(); };

  const dialog = h('div', {
    class: `modal${large ? ' modal-lg' : ''}`,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': title,
  },
    h('div', { class: 'modal-header' },
      h('h3', {}, title),
      h('button', { class: 'modal-close', 'aria-label': 'Cerrar', html: icon('x'), onclick: closeModal })),
    h('div', { class: 'modal-body' }, content),
    actions.length ? h('div', { class: 'modal-footer' }, actions) : null);

  const backdrop = h('div', {
    class: 'modal-backdrop',
    onclick: (e) => { if (e.target === backdrop) closeModal(); },
  }, dialog);

  document.addEventListener('keydown', onKey);
  root.append(backdrop);

  const first = dialog.querySelector('input, select, textarea, button.btn');
  if (first) setTimeout(() => first.focus(), 30);

  return { el: dialog, close: closeModal };
}

export function confirmDialog({ title, message, confirmLabel = 'Eliminar', danger = true }) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (value) => { if (!resolved) { resolved = true; resolve(value); } };

    const modal = openModal({
      title,
      content: h('p', { style: 'margin:0; color: var(--text-2)' }, message),
      actions: [
        h('button', { class: 'btn btn-ghost', onclick: () => { finish(false); modal.close(); } }, 'Cancelar'),
        h('button', {
          class: `btn ${danger ? 'btn-danger' : ''}`,
          onclick: () => { finish(true); modal.close(); },
        }, confirmLabel),
      ],
      onClose: () => finish(false),
    });
  });
}

/* ---------- Tabla ---------- */

export function dataTable(headers, rows, renderRow) {
  const colspan = headers.length;
  const body = rows.length
    ? rows.map(renderRow)
    : h('tr', {}, h('td', { class: 'empty-cell', colspan }, 'No hay registros para mostrar.'));

  return h('div', { class: 'table-wrap' },
    h('table', {},
      h('thead', {}, h('tr', {}, headers.map(t => h('th', {}, t)))),
      h('tbody', {}, body)));
}

export function td(children, attrs = {}) {
  return h('td', attrs, children);
}

export function accionesTd(botones) {
  return h('td', { class: 'actions' }, botones);
}

/* ---------- Formularios ---------- */

let formSeq = 0;

/**
 * Construye un formulario a partir de una lista de campos.
 * Cada campo: { name, label, type, value, options, required, placeholder, hint, pattern, min, max, maxlength, full }
 */
export function buildForm(fields) {
  const id = `form-${++formSeq}`;
  const controls = {};

  const form = h('form', { class: 'form', id, novalidate: false });

  for (const f of fields) {
    const inputId = `f-${id}-${f.name}`;
    const errorId = `e-${id}-${f.name}`;
    let input;

    if (f.type === 'select') {
      input = h('select', { class: 'input', id: inputId, name: f.name, required: f.required !== false },
        h('option', { value: '' }, f.placeholder || 'Seleccione…'),
        (f.options || []).map(o => h('option', { value: o.value }, o.label)));
      if (f.value !== undefined && f.value !== null) input.value = String(f.value);
    } else if (f.type === 'textarea') {
      input = h('textarea', {
        class: 'input', id: inputId, name: f.name, rows: f.rows || 3,
        placeholder: f.placeholder || '', required: f.required !== false, maxlength: f.maxlength,
      });
      input.value = f.value ?? '';
    } else {
      input = h('input', {
        class: 'input',
        type: f.type || 'text',
        id: inputId,
        name: f.name,
        placeholder: f.placeholder || '',
        required: f.required !== false,
        pattern: f.pattern,
        min: f.min,
        max: f.max,
        maxlength: f.maxlength,
        inputmode: f.inputmode,
        autocomplete: 'off',
      });
      input.value = f.value ?? '';
    }

    input.setAttribute('aria-describedby', errorId);
    const error = h('p', { class: 'field-error', id: errorId });

    controls[f.name] = { input, error, field: f };

    form.append(
      h('div', { class: `field${f.full ? ' full' : ''}` },
        h('label', { for: inputId },
          f.label,
          f.required !== false ? h('span', { class: 'req' }, '*') : null),
        input,
        f.hint ? h('p', { class: 'hint' }, f.hint) : null,
        error));
  }

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', (e) => {
    const ctrl = Object.values(controls).find(c => c.input === e.target);
    if (ctrl) limpiarError(ctrl);
  });

  function limpiarError(ctrl) {
    ctrl.error.textContent = '';
    ctrl.input.removeAttribute('aria-invalid');
  }

  function setError(ctrl, msg) {
    ctrl.error.textContent = msg;
    ctrl.input.setAttribute('aria-invalid', 'true');
  }

  return {
    form,
    id,

    values() {
      const out = {};
      for (const [name, ctrl] of Object.entries(controls)) {
        out[name] = ctrl.input.value.trim();
      }
      return out;
    },

    control(name) {
      return controls[name];
    },

    setValues(obj) {
      for (const [name, value] of Object.entries(obj || {})) {
        const ctrl = controls[name];
        if (ctrl) ctrl.input.value = value ?? '';
      }
    },

    clearErrors() {
      Object.values(controls).forEach(limpiarError);
    },

    /** Muestra errores devueltos por la API (formato "campo: mensaje"). */
    showApiErrors(details) {
      let matched = false;
      for (const detalle of details || []) {
        const idx = detalle.indexOf(':');
        if (idx <= 0) continue;
        const campo = detalle.slice(0, idx).trim();
        const ctrl = controls[campo];
        if (ctrl) {
          setError(ctrl, detalle.slice(idx + 1).trim());
          matched = true;
        }
      }
      if (details && details.length && !matched) {
        const first = Object.values(controls)[0];
        if (first) setError(first, details[0]);
      }
      const firstInvalid = Object.values(controls).find(c => c.input.hasAttribute('aria-invalid'));
      if (firstInvalid) firstInvalid.input.focus();
    },

    /** Valida con las reglas del navegador; devuelve true si todo es válido. */
    validate() {
      this.clearErrors();
      if (form.checkValidity()) return true;
      for (const ctrl of Object.values(controls)) {
        if (!ctrl.input.checkValidity()) {
          setError(ctrl, ctrl.input.validationMessage);
          ctrl.input.focus();
          return false;
        }
      }
      return false;
    },
  };
}
