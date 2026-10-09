import { api } from '../api.js';
import {
  h, icon, spinner, errorState, emptyState, toast, openModal, buildForm,
  dataTable, td, manejarError, estadoBadge, fmtCOP, fmtUSD,
} from '../ui.js';

export async function renderMarcas(container) {
  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Marcas'),
        h('p', {}, 'Catálogo de marcas. El nombre es único (regla de negocio de la API).')),
      h('button', { class: 'btn', onclick: () => abrirFormulario(recargar) },
        h('span', { html: icon('plus') }), 'Nueva marca')),
    h('div', { id: 'marcas-host' }));

  await recargar();

  async function recargar() {
    const host = container.querySelector('#marcas-host');
    host.replaceChildren(spinner());
    try {
      const marcas = await api.get('/marcas');
      if (!marcas.length) {
        host.replaceChildren(emptyState('Aún no hay marcas', 'Crea la primera marca para poder asociarle vehículos.'));
        return;
      }
      host.replaceChildren(h('div', { class: 'marcas-grid' },
        marcas.map(m => h('button', {
          class: 'marca-card',
          onclick: () => abrirDetalle(m, recargar),
        },
          h('span', { class: 'marca-logo' }, (m.nombre || '?').charAt(0).toUpperCase()),
          h('span', { class: 'marca-name' }, m.nombre),
          h('span', { class: 'marca-pais' }, m.paisOrigen || 'País no registrado'),
          h('span', { class: 'marca-id' }, `#${m.id}`)))));
    } catch (error) {
      host.replaceChildren(errorState(error, recargar));
    }
  }
}

async function abrirDetalle(marca, onCambios) {
  const contenido = h('div', {}, h('div', { class: 'spinner', style: 'margin: 30px auto;' }));
  const modal = openModal({
    title: `Marca #${marca.id} · ${marca.nombre}`,
    content: contenido,
    large: true,
    actions: [h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cerrar')],
  });

  try {
    // GET /marcas/{id} + GET /vehiculos/marca/{nombre}
    const [detalle, vehiculos] = await Promise.all([
      api.get(`/marcas/${marca.id}`),
      api.get(`/vehiculos/marca/${encodeURIComponent(marca.nombre.trim())}`),
    ]);

    contenido.replaceChildren(
      h('dl', { class: 'detail-list' },
        h('div', { class: 'row' }, h('dt', {}, 'ID'), h('dd', { class: 'mono' }, detalle.id)),
        h('div', { class: 'row' }, h('dt', {}, 'Nombre'), h('dd', {}, detalle.nombre)),
        h('div', { class: 'row' }, h('dt', {}, 'País de origen'), h('dd', {}, detalle.paisOrigen || '—'))),

      h('h4', { style: 'margin: 4px 0 10px; font-size: 14px;' },
        `Vehículos de esta marca (${vehiculos.length})`),

      vehiculos.length
        ? dataTable(['Placa', 'Modelo', 'Año', 'Precio COP', 'Precio USD', 'Estado'], vehiculos,
            v => h('tr', {},
              td(h('span', { class: 'mono primary-cell' }, v.placa)),
              td(v.modelo),
              td(v.anio, { class: 'num' }),
              td(fmtCOP(v.precioCop), { class: 'num' }),
              td(fmtUSD(v.precioUsd), { class: 'num' }),
              td(estadoBadge(v.estado))))
        : h('p', { style: 'color: var(--text-3); font-size: 13.5px;' },
            'Esta marca aún no tiene vehículos registrados.'));
  } catch (error) {
    contenido.replaceChildren(errorState(error, () => {
      modal.close();
      abrirDetalle(marca, onCambios);
    }));
  }
}

function abrirFormulario(onSaved) {
  const form = buildForm([
    { name: 'nombre', label: 'Nombre de la marca', maxlength: 60, placeholder: 'Ej. Toyota' },
    { name: 'paisOrigen', label: 'País de origen', required: false, maxlength: 60, placeholder: 'Ej. Japón' },
  ]);

  const guardar = h('button', { class: 'btn' }, 'Crear marca');
  const modal = openModal({
    title: 'Nueva marca',
    content: form.form,
    actions: [
      h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cancelar'),
      guardar,
    ],
  });

  guardar.addEventListener('click', async () => {
    if (!form.validate()) return;
    const v = form.values();
    guardar.disabled = true;
    guardar.textContent = 'Guardando…';
    try {
      const creada = await api.post('/marcas', { nombre: v.nombre, paisOrigen: v.paisOrigen });
      toast('success', `Marca “${creada.nombre}” creada (ID ${creada.id}).`);
      modal.close();
      onSaved();
    } catch (error) {
      manejarError(error, 'No se pudo crear la marca', form);
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Crear marca';
    }
  });
}
