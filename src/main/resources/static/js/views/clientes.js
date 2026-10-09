import { api } from '../api.js';
import {
  h, icon, spinner, errorState, emptyState, toast, confirmDialog, openModal,
  buildForm, dataTable, td, accionesTd, manejarError,
} from '../ui.js';

let filtroTexto = '';

export async function renderClientes(container) {
  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Clientes'),
        h('p', {}, 'Alta, consulta, edición y baja de clientes del concesionario.')),
      h('button', { class: 'btn', onclick: () => abrirFormulario(null, recargar) },
        h('span', { html: icon('plus') }), 'Nuevo cliente')),
    h('div', { class: 'toolbar' },
      h('div', { class: 'search-box' },
        h('span', { html: icon('search') }),
        h('input', {
          class: 'input', type: 'search', placeholder: 'Buscar por nombre, documento o email…',
          value: filtroTexto,
          oninput: (e) => { filtroTexto = e.target.value; aplicarFiltro(); },
        }))),
    h('div', { id: 'clientes-host' }));

  await recargar();

  async function recargar() {
    const host = container.querySelector('#clientes-host');
    host.replaceChildren(spinner());
    try {
      const clientes = await api.get('/clientes');
      host.dataset.raw = JSON.stringify(clientes);
      renderTabla(clientes);
    } catch (error) {
      host.replaceChildren(errorState(error, recargar));
    }
  }

  function aplicarFiltro() {
    const host = container.querySelector('#clientes-host');
    if (!host.dataset.raw) return;
    renderTabla(JSON.parse(host.dataset.raw));
  }

  function renderTabla(clientes) {
    const host = container.querySelector('#clientes-host');
    const texto = filtroTexto.trim().toLowerCase();
    const filtrados = texto
      ? clientes.filter(c =>
          (c.nombre || '').toLowerCase().includes(texto) ||
          (c.documento || '').toLowerCase().includes(texto) ||
          (c.email || '').toLowerCase().includes(texto))
      : clientes;

    if (!filtrados.length) {
      host.replaceChildren(clientes.length
        ? emptyState('Sin coincidencias', `Ningún cliente coincide con “${filtroTexto}”.`)
        : emptyState('Aún no hay clientes', 'Crea el primer cliente con el botón “Nuevo cliente”.'));
      return;
    }

    host.replaceChildren(dataTable(
      ['ID', 'Nombre', 'Documento', 'Email', 'Teléfono', 'Acciones'],
      filtrados,
      c => h('tr', {},
        td(String(c.id), { class: 'mono' }),
        td(h('span', { class: 'primary-cell' }, c.nombre)),
        td(c.documento, { class: 'mono' }),
        td(c.email || '—'),
        td(c.telefono || '—', { class: 'num' }),
        accionesTd([
          h('button', {
            class: 'btn-icon', title: 'Editar', html: icon('edit'),
            onclick: () => abrirFormulario(c.id, recargar),
          }),
          h('button', {
            class: 'btn-icon danger', title: 'Eliminar', html: icon('trash'),
            onclick: () => eliminar(c),
          }),
        ]))));
  }

  async function eliminar(cliente) {
    const ok = await confirmDialog({
      title: 'Eliminar cliente',
      message: `¿Seguro que quieres eliminar a “${cliente.nombre}” (doc. ${cliente.documento})? Esta acción no se puede deshacer.`,
    });
    if (!ok) return;
    try {
      await api.del(`/clientes/${cliente.id}`);
      toast('success', `Cliente “${cliente.nombre}” eliminado.`);
      await recargar();
    } catch (error) {
      manejarError(error, 'No se pudo eliminar el cliente');
    }
  }
}

function camposCliente() {
  return [
    { name: 'nombre', label: 'Nombre completo', maxlength: 100, full: true, placeholder: 'Ej. María Pérez' },
    { name: 'documento', label: 'Documento', pattern: '[0-9]{5,15}', hint: 'Entre 5 y 15 dígitos, solo números.', placeholder: 'Ej. 1035987654' },
    { name: 'telefono', label: 'Teléfono', required: false, pattern: '[0-9+ ]{7,20}', hint: 'Opcional: 7 a 20 dígitos.', placeholder: 'Ej. 3001234567' },
    { name: 'email', label: 'Email', type: 'email', maxlength: 100, placeholder: 'Ej. cliente@correo.com' },
  ];
}

function abrirFormulario(id, onSaved) {
  const editando = id !== null && id !== undefined;
  const form = buildForm(camposCliente());

  const guardar = h('button', { class: 'btn' }, 'Guardar');
  const modal = openModal({
    title: editando ? `Editar cliente #${id}` : 'Nuevo cliente',
    content: form.form,
    actions: [
      h('button', { class: 'btn btn-ghost', onclick: () => modal.close() }, 'Cancelar'),
      guardar,
    ],
  });

  guardar.addEventListener('click', async () => {
    if (!form.validate()) return;
    const v = form.values();
    const payload = { nombre: v.nombre, documento: v.documento, email: v.email, telefono: v.telefono };

    guardar.disabled = true;
    guardar.textContent = 'Guardando…';
    try {
      const guardado = editando
        ? await api.put(`/clientes/${id}`, payload)
        : await api.post('/clientes', payload);
      toast('success', editando
        ? `Cliente “${guardado.nombre}” actualizado.`
        : `Cliente “${guardado.nombre}” creado (ID ${guardado.id}).`);
      modal.close();
      onSaved();
    } catch (error) {
      manejarError(error, editando ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente', form);
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Guardar';
    }
  });

  if (editando) {
    api.get(`/clientes/${id}`)
      .then(c => form.setValues(c))
      .catch(error => {
        manejarError(error, 'No se pudo cargar el cliente');
        modal.close();
      });
  }
}
