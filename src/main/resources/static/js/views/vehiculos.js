import { api } from '../api.js';
import {
  h, icon, spinner, errorState, emptyState, toast, confirmDialog, openModal,
  buildForm, dataTable, td, accionesTd, manejarError, estadoBadge,
  fmtCOP, fmtUSD, fmtFecha,
} from '../ui.js';

let filtroEstado = 'todos';
let filtroMarca = 'todas';
let filtroTexto = '';

export async function renderVehiculos(container) {
  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Vehículos'),
        h('p', {}, 'Inventario con precios en COP y USD (tasa de cambio de la API externa).')),
      h('button', { class: 'btn', id: 'btn-nuevo-vehiculo', disabled: true, onclick: () => abrirFormulario(null, marcas, recargar) },
        h('span', { html: icon('plus') }), 'Nuevo vehículo')),
    h('div', { class: 'toolbar' },
      h('div', { class: 'search-box' },
        h('span', { html: icon('search') }),
        h('input', {
          class: 'input', type: 'search', placeholder: 'Buscar por placa o modelo…',
          value: filtroTexto,
          oninput: (e) => { filtroTexto = e.target.value; aplicarFiltro(); },
        })),
      h('select', {
        class: 'input',
        onchange: (e) => { filtroEstado = e.target.value; recargar(); },
      },
        h('option', { value: 'todos', selected: filtroEstado === 'todos' }, 'Todos los estados'),
        h('option', { value: 'disponibles', selected: filtroEstado === 'disponibles' }, 'Solo disponibles')),
      h('select', {
        class: 'input',
        id: 'filtro-marca',
        onchange: (e) => { filtroMarca = e.target.value; recargar(); },
      },
        h('option', { value: 'todas' }, 'Todas las marcas'),
        [])),
    h('div', { id: 'vehiculos-host' }));

  const selectMarca = container.querySelector('#filtro-marca');

  let marcas = [];
  try {
    marcas = await api.get('/marcas');
    for (const m of marcas) {
      selectMarca.append(h('option', { value: m.nombre, selected: filtroMarca === m.nombre }, m.nombre));
    }
    container.querySelector('#btn-nuevo-vehiculo').disabled = false;
  } catch (e) {
    toast('warning', 'No se pudieron cargar las marcas: no se podrá crear vehículos nuevos.');
  }

  await recargar();

  async function recargar() {
    const host = container.querySelector('#vehiculos-host');
    host.replaceChildren(spinner());
    try {
      let vehiculos;
      if (filtroMarca !== 'todas') {
        // GET /vehiculos/marca/{nombre}
        vehiculos = await api.get(`/vehiculos/marca/${encodeURIComponent(filtroMarca.trim())}`);
        if (filtroEstado === 'disponibles') {
          vehiculos = vehiculos.filter(v => v.estado === 'DISPONIBLE');
        }
      } else if (filtroEstado === 'disponibles') {
        // GET /vehiculos/disponibles
        vehiculos = await api.get('/vehiculos/disponibles');
      } else {
        vehiculos = await api.get('/vehiculos');
      }
      host.dataset.raw = JSON.stringify(vehiculos);
      renderTabla(vehiculos);
    } catch (error) {
      host.replaceChildren(errorState(error, recargar));
    }
  }

  function aplicarFiltro() {
    const host = container.querySelector('#vehiculos-host');
    if (!host.dataset.raw) return;
    renderTabla(JSON.parse(host.dataset.raw));
  }

  function renderTabla(vehiculos) {
    const host = container.querySelector('#vehiculos-host');
    const texto = filtroTexto.trim().toLowerCase();
    const filtrados = texto
      ? vehiculos.filter(v =>
          (v.placa || '').toLowerCase().includes(texto) ||
          (v.modelo || '').toLowerCase().includes(texto) ||
          (v.marca || '').toLowerCase().includes(texto))
      : vehiculos;

    if (!filtrados.length) {
      host.replaceChildren(vehiculos.length
        ? emptyState('Sin coincidencias', `Ningún vehículo coincide con “${filtroTexto}”.`)
        : emptyState('No hay vehículos con este filtro', 'Cambia los filtros o crea un vehículo nuevo.'));
      return;
    }

    host.replaceChildren(dataTable(
      ['Placa', 'Marca', 'Modelo', 'Año', 'Color', 'Precio COP', 'Precio USD', 'Estado', 'Acciones'],
      filtrados,
      v => h('tr', {},
        td(h('span', { class: 'mono primary-cell' }, v.placa)),
        td(v.marca),
        td(v.modelo),
        td(v.anio, { class: 'num' }),
        td(v.color || '—'),
        td(fmtCOP(v.precioCop), { class: 'num' }),
        td(fmtUSD(v.precioUsd), { class: 'num' }),
        td(estadoBadge(v.estado)),
        accionesTd([
          v.estado === 'EN_MANTENIMIENTO'
            ? h('button', {
                class: 'btn-icon', title: 'Salir del taller (marcar disponible)', html: icon('check'),
                onclick: () => salirTaller(v),
              })
            : null,
          h('button', { class: 'btn-icon', title: 'Ver detalle', html: icon('eye'), onclick: () => verDetalle(v) }),
          h('button', { class: 'btn-icon', title: 'Historial de mantenimientos', html: icon('history'), onclick: () => verHistorial(v) }),
          h('button', { class: 'btn-icon', title: 'Editar', html: icon('edit'), onclick: () => abrirFormulario(v.id, marcas, recargar) }),
          h('button', { class: 'btn-icon danger', title: 'Eliminar', html: icon('trash'), onclick: () => eliminar(v) }),
        ]))));
  }

  function verDetalle(vehiculo) {
    // GET /vehiculos/{id} para ver la información más reciente
    const body = h('div', {}, h('div', { class: 'spinner', style: 'margin: 26px auto;' }));
    const modal = openModal({
      title: `Vehículo ${vehiculo.placa}`,
      content: body,
      actions: [h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cerrar')],
    });

    api.get(`/vehiculos/${vehiculo.id}`)
      .then(v => {
        body.replaceChildren(
          h('dl', { class: 'detail-list' },
            h('div', { class: 'row' }, h('dt', {}, 'ID'), h('dd', { class: 'mono' }, v.id)),
            h('div', { class: 'row' }, h('dt', {}, 'Placa'), h('dd', { class: 'mono' }, v.placa)),
            h('div', { class: 'row' }, h('dt', {}, 'Marca'), h('dd', {}, `${v.marca} (ID ${v.marcaId})`)),
            h('div', { class: 'row' }, h('dt', {}, 'Modelo'), h('dd', {}, v.modelo)),
            h('div', { class: 'row' }, h('dt', {}, 'Año'), h('dd', {}, v.anio)),
            h('div', { class: 'row' }, h('dt', {}, 'Color'), h('dd', {}, v.color || '—')),
            h('div', { class: 'row' }, h('dt', {}, 'Precio (COP)'), h('dd', {}, fmtCOP(v.precioCop))),
            h('div', { class: 'row' }, h('dt', {}, 'Precio (USD)'), h('dd', {}, fmtUSD(v.precioUsd))),
            h('div', { class: 'row' }, h('dt', {}, 'Tasa usada'), h('dd', {}, `1 USD = ${fmtCOP(v.tasaCambioCopPorUsd)}`)),
            h('div', { class: 'row' }, h('dt', {}, 'Estado'), h('dd', {}, estadoBadge(v.estado)))));
      })
      .catch(error => {
        body.replaceChildren(errorState(error, () => { modal.close(); }));
      });
  }

  async function verHistorial(vehiculo) {
    // GET /mantenimientos/vehiculo/{id}
    const body = h('div', {}, h('div', { class: 'spinner', style: 'margin: 26px auto;' }));
    const modal = openModal({
      title: `Historial de mantenimientos · ${vehiculo.placa}`,
      content: body,
      large: true,
      actions: [h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cerrar')],
    });

    try {
      const historial = await api.get(`/mantenimientos/vehiculo/${vehiculo.id}`);
      body.replaceChildren(historial.length
        ? dataTable(['ID', 'Fecha', 'Descripción', 'Costo'], historial,
            m => h('tr', {},
              td(String(m.id), { class: 'mono' }),
              td(fmtFecha(m.fecha), { class: 'num' }),
              td(h('span', { class: 'primary-cell' }, m.descripcion)),
              td(fmtCOP(m.costo), { class: 'num' })))
        : h('p', { style: 'color: var(--text-3); margin: 0;' },
            'Este vehículo todavía no tiene mantenimientos registrados.'));
    } catch (error) {
      body.replaceChildren(errorState(error, () => { modal.close(); verHistorial(vehiculo); }));
    }
  }

  async function salirTaller(vehiculo) {
    const ok = await confirmDialog({
      title: 'Sacar del taller',
      message: `El vehículo ${vehiculo.placa} está EN_MANTENIMIENTO. ¿Marcarlo como DISPONIBLE (salida de taller)?`,
      confirmLabel: 'Marcar disponible',
      danger: false,
    });
    if (!ok) return;
    try {
      await api.post(`/vehiculos/${vehiculo.id}/salir-taller`);
      toast('success', `Vehículo ${vehiculo.placa} volvió a estado DISPONIBLE.`);
      await recargar();
    } catch (error) {
      manejarError(error, 'No se pudo cambiar el estado del vehículo');
    }
  }

  async function eliminar(vehiculo) {
    const ok = await confirmDialog({
      title: 'Eliminar vehículo',
      message: `¿Eliminar el vehículo ${vehiculo.placa} (${vehiculo.marca} ${vehiculo.modelo})? Si ya fue vendido, la API rechazará la operación.`,
    });
    if (!ok) return;
    try {
      await api.del(`/vehiculos/${vehiculo.id}`);
      toast('success', `Vehículo ${vehiculo.placa} eliminado.`);
      await recargar();
    } catch (error) {
      manejarError(error, 'No se pudo eliminar el vehículo');
    }
  }
}

function abrirFormulario(id, marcas, onSaved) {
  const editando = id !== null && id !== undefined;

  if (!marcas.length) {
    toast('warning', 'Primero debes crear una marca (menú Marcas) para poder dar de alta vehículos.');
    return;
  }

  const form = buildForm([
    { name: 'placa', label: 'Placa', pattern: '[A-Za-z]{3}-?[0-9]{2}[A-Za-z0-9]', hint: 'Formato ABC123 (carro) o ABC12D (moto). Se guarda sin guion y en mayúsculas.', placeholder: 'Ej. ABC123' },
    { name: 'marcaId', label: 'Marca', type: 'select', options: marcas.map(m => ({ value: m.id, label: m.nombre })), placeholder: 'Seleccione la marca…' },
    { name: 'modelo', label: 'Modelo', maxlength: 60, placeholder: 'Ej. Corolla' },
    { name: 'anio', label: 'Año', type: 'number', min: 1950, max: 2100, placeholder: 'Ej. 2022' },
    { name: 'color', label: 'Color', required: false, maxlength: 30, placeholder: 'Ej. Blanco' },
    { name: 'precio', label: 'Precio en COP', type: 'number', min: 0, step: '0.01', hint: 'Precio en pesos colombianos; la API calcula el equivalente en USD.', placeholder: 'Ej. 85000000' },
  ]);

  const guardar = h('button', { class: 'btn' }, editando ? 'Guardar cambios' : 'Crear vehículo');
  const modal = openModal({
    title: editando ? `Editar vehículo #${id}` : 'Nuevo vehículo',
    content: form.form,
    actions: [
      h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cancelar'),
      guardar,
    ],
  });

  guardar.addEventListener('click', async () => {
    if (!form.validate()) return;
    const v = form.values();
    const payload = {
      placa: v.placa,
      marcaId: Number(v.marcaId),
      modelo: v.modelo,
      anio: Number(v.anio),
      color: v.color || null,
      precio: Number(v.precio),
    };

    guardar.disabled = true;
    guardar.textContent = 'Guardando…';
    try {
      const guardado = editando
        ? await api.put(`/vehiculos/${id}`, payload)
        : await api.post('/vehiculos', payload);
      toast('success', editando
        ? `Vehículo ${guardado.placa} actualizado.`
        : `Vehículo ${guardado.placa} creado (ID ${guardado.id}).`);
      modal.close();
      onSaved();
    } catch (error) {
      manejarError(error, editando ? 'No se pudo actualizar el vehículo' : 'No se pudo crear el vehículo', form);
    } finally {
      guardar.disabled = false;
      guardar.textContent = editando ? 'Guardar cambios' : 'Crear vehículo';
    }
  });

  if (editando) {
    api.get(`/vehiculos/${id}`)
      .then(v => form.setValues({
        placa: v.placa,
        marcaId: v.marcaId,
        modelo: v.modelo,
        anio: v.anio,
        color: v.color || '',
        precio: v.precioCop,
      }))
      .catch(error => {
        manejarError(error, 'No se pudo cargar el vehículo');
        modal.close();
      });
  }
}
