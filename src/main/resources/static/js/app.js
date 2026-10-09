import { api } from './api.js';
import { spinner, errorState } from './ui.js';
import { renderDashboard } from './views/dashboard.js';
import { renderClientes } from './views/clientes.js';
import { renderMarcas } from './views/marcas.js';
import { renderVehiculos } from './views/vehiculos.js';
import { renderVentas } from './views/ventas.js';
import { renderMantenimientos } from './views/mantenimientos.js';

const routes = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  clientes: { title: 'Clientes', render: renderClientes },
  marcas: { title: 'Marcas', render: renderMarcas },
  vehiculos: { title: 'Vehículos', render: renderVehiculos },
  ventas: { title: 'Ventas', render: renderVentas },
  mantenimientos: { title: 'Mantenimientos', render: renderMantenimientos },
};

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const view = document.getElementById('view');
const pageTitle = document.getElementById('page-title');

function rutaActual() {
  const cruda = location.hash.replace(/^#\/?/, '');
  const nombre = cruda.split('/')[0];
  return routes[nombre] ? nombre : 'dashboard';
}

function marcarActiva(nombre) {
  document.querySelectorAll('#nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === nombre);
  });
}

function cerrarSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

async function mostrarVista() {
  const nombre = rutaActual();
  const ruta = routes[nombre];

  marcarActiva(nombre);
  pageTitle.textContent = ruta.title;
  document.title = `${ruta.title} · Concesionario`;
  cerrarSidebar();

  view.replaceChildren(spinner());
  try {
    await ruta.render(view);
  } catch (error) {
    view.replaceChildren(errorState(error, mostrarVista));
  }
}

/* ---------- Indicador de estado de la API ---------- */

function setApiStatus(estado) {
  const el = document.getElementById('api-status');
  const label = el.querySelector('.label');
  el.dataset.state = estado;
  label.textContent = estado === 'online' ? 'API en línea'
    : estado === 'offline' ? 'API sin conexión'
    : 'Verificando API…';
}

window.addEventListener('api:status', (e) => setApiStatus(e.detail ? 'online' : 'offline'));

/* ---------- Eventos globales ---------- */

document.getElementById('btn-menu').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});

overlay.addEventListener('click', cerrarSidebar);

document.getElementById('btn-refresh').addEventListener('click', () => {
  mostrarVista();
  ping();
});

document.querySelectorAll('#nav a').forEach(a => {
  a.addEventListener('click', cerrarSidebar);
});

window.addEventListener('hashchange', mostrarVista);

async function ping() {
  setApiStatus('checking');
  try {
    await api.get('/marcas');
    setApiStatus('online');
  } catch (e) {
    setApiStatus('offline');
  }
}

/* ---------- Arranque ---------- */

if (!location.hash) location.hash = '#/dashboard';
mostrarVista();
ping();
