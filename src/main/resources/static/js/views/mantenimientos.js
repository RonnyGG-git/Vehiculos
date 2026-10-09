import { api } from '../api.js';
import {
  h, icon, spinner, errorState, emptyState, toast, openModal, buildForm,
  dataTable, td, manejarError, fmtCOP, fmtFecha, hoyISO,
} from '../ui.js';

let filtroVehiculo = '';

export async function renderMantenimientos(container) {
  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Mantenimientos'),
        h('p', {}, 'Registro de ingresos a taller. El vehículo pasa a estado EN_MANTENIMIENTO.')),
      h('button', { class: 'btn', onclick: () => abrirFormulario(recargar) },
        h('span', { html: icon('plus') }), 'Nuevo mantenimiento')),
    h('div', { class: 'toolbar' },
      h('select', { id: 'filtro-vehiculo', class: 'input', onchange: (e) => { filtroVehiculo = e.target.value; recargar(); } },
        h('option', { value: '' }, 'Todos los vehículos'))),
    h('div', { id: 'mantenimientos-host' }));

  const selectVehiculo = container.querySelector('#filtro-vehiculo');

  try {
    const vehiculos = await api.get('/vehiculos');
    for (const v of vehiculos) {
      selectVehiculo.append(h('option',
        { value: v.id, selected: String(filtroVehiculo) === String(v.id) },
        `${v.placa} · ${v.marca} ${v.modelo}`));
    }
  } catch (e) {
    toast('warning', 'No se pudo cargar el listado de vehículos para el filtro.');
  }

  await recargar();

  async function recargar() {
    const host = container.querySelector('#mantenimientos-host');
    host.replaceChildren(spinner());
    try {
      // GET /mantenimientos o GET /mantenimientos/vehiculo/{id}
      const mantenimientos = filtroVehiculo
        ? await api.get(`/mantenimientos/vehiculo/${filtroVehiculo}`)
        : await api.get('/mantenimientos');

      if (!mantenimientos.length) {
        host.replaceChildren(emptyState(
          filtroVehiculo ? 'Este vehículo no tiene mantenimientos' : 'Aún no hay mantenimientos',
          'Registra el primer ingreso a taller con el botón “Nuevo mantenimiento”.'));
        return;
      }

      const costoTotal = mantenimientos.reduce((acc, m) => acc + Number(m.costo || 0), 0);

      host.replaceChildren(h('div', { class: 'card' },
        h('div', { class: 'card-header' },
          h('div', {},
            h('h2', {}, filtroVehiculo ? 'Historial del vehículo' : 'Todos los mantenimientos'),
            h('p', {}, `${mantenimientos.length} registro(s) · Costo acumulado: ${fmtCOP(costoTotal)}`))),
        dataTable(
          ['#', 'Fecha', 'Vehículo', 'Descripción', 'Costo'],
          mantenimientos,
          m => h('tr', {},
            td(String(m.id), { class: 'mono' }),
            td(fmtFecha(m.fecha), { class: 'num' }),
            td(h('span', { class: 'mono primary-cell' }, m.vehiculoPlaca),
               h('div', { style: 'font-size: 12px; color: var(--text-3);' }, `#${m.vehiculoId}`)),
            td(m.descripcion),
            td(fmtCOP(m.costo), { class: 'num' })))));
    } catch (error) {
      host.replaceChildren(errorState(error, recargar));
    }
  }
}

function abrirFormulario(onSaved) {
  const body = h('div', {}, h('div', { class: 'spinner', style: 'margin: 26px auto;' }));
  const guardar = h('button', { class: 'btn', disabled: true }, 'Registrar');

  const modal = openModal({
    title: 'Nuevo mantenimiento',
    content: body,
    actions: [
      h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cancelar'),
      guardar,
    ],
  });

  api.get('/vehiculos')
    .then(vehiculos => {
      const vendidos = vehiculos.filter(v => v.estado === 'VENDIDO');
      const aptos = vehiculos.filter(v => v.estado !== 'VENDIDO');

      if (!aptos.length) {
        body.replaceChildren(emptyState('No hay vehículos aptos',
          vendidos.length
            ? 'Todos los vehículos están vendidos: la API no permite registrar mantenimientos sobre vehículos VENDIDO.'
            : 'Crea un vehículo antes de registrarle un mantenimiento.'));
        return;
      }

      const form = buildForm([
        {
          name: 'vehiculoId', label: 'Vehículo', type: 'select', full: true,
          options: aptos.map(v => ({
            value: v.id,
            label: `${v.placa} · ${v.marca} ${v.modelo}${v.estado === 'EN_MANTENIMIENTO' ? ' (ya en taller)' : ''}`,
          })),
          placeholder: 'Seleccione el vehículo…',
          hint: 'No se permite vehículos en estado VENDIDO (regla de la API).',
        },
        { name: 'descripcion', label: 'Descripción del trabajo', maxlength: 255, full: true, placeholder: 'Ej. Cambio de aceite y filtros' },
        { name: 'costo', label: 'Costo en COP', type: 'number', min: 0, step: '0.01', placeholder: 'Ej. 350000' },
        { name: 'fecha', label: 'Fecha', type: 'date', required: false, value: hoyISO(), hint: 'Si se deja vacía, la API usa la fecha actual.' },
      ]);

      body.replaceChildren(form.form);
      guardar.disabled = false;

      guardar.onclick = async () => {
        if (!form.validate()) return;
        const v = form.values();
        const payload = {
          vehiculoId: Number(v.vehiculoId),
          descripcion: v.descripcion,
          costo: v.costo === '' ? null : Number(v.costo),
          fecha: v.fecha || null,
        };
        guardar.disabled = true;
        guardar.textContent = 'Registrando…';
        try {
          const m = await api.post('/mantenimientos', payload);
          toast('success', `Mantenimiento #${m.id} registrado para ${m.vehiculoPlaca} (costo ${fmtCOP(m.costo)}).`);
          modal.close();
          onSaved();
        } catch (error) {
          manejarError(error, 'No se pudo registrar el mantenimiento', form);
          guardar.disabled = false;
          guardar.textContent = 'Registrar';
        }
      };
    })
    .catch(error => {
      body.replaceChildren(errorState(error, () => {
        modal.close();
        abrirFormulario(onSaved);
      }));
    });
}
