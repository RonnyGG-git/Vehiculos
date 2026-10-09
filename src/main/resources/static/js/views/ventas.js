import { api } from '../api.js';
import {
  h, icon, spinner, errorState, emptyState, toast, openModal, buildForm,
  dataTable, td, manejarError, fmtCOP, fmtFechaHora,
} from '../ui.js';

const UMBRAL = 100000000;
const PORCENTAJE = 0.05;

export async function renderVentas(container) {
  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Ventas'),
        h('p', {}, 'Registro de ventas. El servidor calcula fecha, descuento (5 % sobre $100M) y total.')),
      h('button', { class: 'btn', onclick: () => abrirFormulario(recargar) },
        h('span', { html: icon('plus') }), 'Nueva venta')),
    h('div', { id: 'ventas-host' }));

  await recargar();

  async function recargar() {
    const host = container.querySelector('#ventas-host');
    host.replaceChildren(spinner());
    try {
      const ventas = await api.get('/ventas');
      if (!ventas.length) {
        host.replaceChildren(emptyState('Aún no hay ventas',
          'Registra la primera venta: solo necesitas un cliente y un vehículo disponible.'));
        return;
      }

      const total = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);

      host.replaceChildren(
        h('div', { class: 'card' },
          h('div', { class: 'card-header' },
            h('div', {},
              h('h2', {}, 'Historial de ventas'),
              h('p', {}, `${ventas.length} venta(s) · Total facturado: ${fmtCOP(total)}`))),
          dataTable(
            ['#', 'Fecha', 'Cliente', 'Vehículo', 'Precio base', 'Descuento', 'Total'],
            ventas,
            v => h('tr', {},
              td(String(v.id), { class: 'mono' }),
              td(fmtFechaHora(v.fechaVenta), { class: 'num' }),
              td(h('span', { class: 'primary-cell' }, v.clienteNombre),
                 h('div', { style: 'font-size: 12px; color: var(--text-3);' }, `#${v.clienteId}`)),
              td(h('span', { class: 'mono' }, v.vehiculoPlaca),
                 h('div', { style: 'font-size: 12px; color: var(--text-3);' }, `#${v.vehiculoId}`)),
              td(fmtCOP(v.precioBase), { class: 'num' }),
              td(Number(v.descuento) > 0
                ? h('span', { class: 'badge warning no-dot' }, `−${fmtCOP(v.descuento)}`)
                : h('span', { style: 'color: var(--text-3);' }, 'Sin descuento'), { class: 'num' }),
              td(h('strong', {}, fmtCOP(v.total)), { class: 'num' })))));
    } catch (error) {
      host.replaceChildren(errorState(error, recargar));
    }
  }
}

function abrirFormulario(onSaved) {
  const body = h('div', {}, h('div', { class: 'spinner', style: 'margin: 26px auto;' }));
  const guardar = h('button', { class: 'btn', disabled: true }, 'Registrar venta');

  const modal = openModal({
    title: 'Nueva venta',
    content: body,
    actions: [
      h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cancelar'),
      guardar,
    ],
  });

  Promise.all([api.get('/clientes'), api.get('/vehiculos/disponibles')])
    .then(([clientes, disponibles]) => {
      if (!clientes.length) {
        body.replaceChildren(emptyState('No hay clientes', 'Crea al menos un cliente antes de registrar una venta.'));
        return;
      }
      if (!disponibles.length) {
        body.replaceChildren(emptyState('No hay vehículos disponibles', 'El inventario no tiene vehículos en estado DISPONIBLE para vender.'));
        return;
      }

      const form = buildForm([
        {
          name: 'clienteId', label: 'Cliente', type: 'select',
          options: clientes.map(c => ({ value: c.id, label: `${c.nombre} · doc. ${c.documento}` })),
          placeholder: 'Seleccione el cliente…',
        },
        {
          name: 'vehiculoId', label: 'Vehículo disponible', type: 'select',
          options: disponibles.map(v => ({
            value: v.id,
            label: `${v.placa} · ${v.marca} ${v.modelo} · ${fmtCOP(v.precioCop)}`,
          })),
          placeholder: 'Seleccione el vehículo…',
        },
      ]);

      const preview = h('div', { class: 'preview-box', style: 'display: none;' });
      body.replaceChildren(form.form, preview);

      const vehiculoSel = form.control('vehiculoId').input;

      const actualizarPreview = () => {
        const vehiculo = disponibles.find(v => String(v.id) === vehiculoSel.value);
        if (!vehiculo) {
          preview.style.display = 'none';
          return;
        }
        const base = Number(vehiculo.precioCop);
        const descuento = base > UMBRAL ? base * PORCENTAJE : 0;
        preview.style.display = 'grid';
        preview.replaceChildren(
          h('div', { class: 'row' },
            h('span', { class: 'muted' }, 'Precio base'),
            h('span', {}, fmtCOP(base))),
          h('div', { class: 'row' },
            h('span', { class: 'muted' }, 'Descuento estimado (5 % si supera $100.000.000)'),
            h('span', {}, descuento ? `−${fmtCOP(descuento)}` : fmtCOP(0))),
          h('div', { class: 'row total' },
            h('span', {}, 'Total estimado'),
            h('span', {}, fmtCOP(base - descuento))));
      };

      vehiculoSel.addEventListener('change', actualizarPreview);

      guardar.onclick = async () => {
        if (!form.validate()) return;
        const v = form.values();
        guardar.disabled = true;
        guardar.textContent = 'Registrando…';
        try {
          const venta = await api.post('/ventas', {
            clienteId: Number(v.clienteId),
            vehiculoId: Number(v.vehiculoId),
          });
          toast('success',
            `Venta #${venta.id} registrada: ${venta.vehiculoPlaca} a ${venta.clienteNombre} por ${fmtCOP(venta.total)}.`,
            Number(venta.descuento) > 0 ? [`Descuento aplicado: −${fmtCOP(venta.descuento)}`] : []);
          modal.close();
          onSaved();
        } catch (error) {
          manejarError(error, 'No se pudo registrar la venta', form);
          guardar.disabled = false;
          guardar.textContent = 'Registrar venta';
        }
      };

      guardar.disabled = false;
    })
    .catch(error => {
      body.replaceChildren(errorState(error, () => {
        modal.close();
        abrirFormulario(onSaved);
      }));
    });
}
