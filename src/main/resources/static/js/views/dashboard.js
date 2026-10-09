import { api } from '../api.js';
import {
  h, icon, spinner, errorState, fmtCOP, fmtFecha, fmtFechaHora, fmtUSD,
  dataTable, estadoBadge,
} from '../ui.js';

export async function renderDashboard(container) {
  container.replaceChildren(spinner());

  let datos;
  try {
    const [clientes, vehiculos, disponibles, ventas, mantenimientos, marcas] = await Promise.all([
      api.get('/clientes'),
      api.get('/vehiculos'),
      api.get('/vehiculos/disponibles'),
      api.get('/ventas'),
      api.get('/mantenimientos'),
      api.get('/marcas'),
    ]);
    datos = { clientes, vehiculos, disponibles, ventas, mantenimientos, marcas };
  } catch (error) {
    container.replaceChildren(errorState(error, () => renderDashboard(container)));
    return;
  }

  const { clientes, vehiculos, disponibles, ventas, mantenimientos, marcas } = datos;
  const tasa = vehiculos.length ? vehiculos[0].tasaCambioCopPorUsd : null;
  const ultimasVentas = [...ventas].slice(-6).reverse();
  const ultimosMant = [...mantenimientos].slice(-6).reverse();
  const facturado = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const costoMant = mantenimientos.reduce((acc, m) => acc + Number(m.costo || 0), 0);

  const kpi = (color, iconName, label, valor, sub) =>
    h('div', { class: 'kpi' },
      h('span', { class: `kpi-icon ${color}`, html: icon(iconName) }),
      h('div', { class: 'kpi-body' },
        h('div', { class: 'kpi-label' }, label),
        h('div', { class: 'kpi-value' }, valor),
        sub ? h('div', { class: 'kpi-sub' }, sub) : null));

  const linkBtn = (hash, label) =>
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { location.hash = hash; } }, label);

  container.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {},
        h('h2', {}, 'Panel general'),
        h('p', {}, 'Resumen del concesionario en tiempo real.')),
      tasa ? h('span', { class: 'badge primary no-dot', style: 'font-size: 13px; padding: 7px 13px;' },
        `1 USD = ${Number(tasa).toLocaleString('es-CO', { maximumFractionDigits: 2 })} COP`) : null),

    h('div', { class: 'kpi-grid' },
      kpi('blue', 'users', 'Clientes', clientes.length, 'registrados'),
      kpi('green', 'car', 'Vehículos', vehiculos.length, `${disponibles.length} disponibles`),
      kpi('cyan', 'cart', 'Ventas', ventas.length, fmtCOP(facturado) + ' facturado'),
      kpi('amber', 'tool', 'Mantenimientos', mantenimientos.length, fmtCOP(costoMant) + ' en costos'),
      kpi('red', 'tag', 'Marcas', marcas.length, 'en catálogo')),

    h('div', { class: 'grid-2' },
      h('div', { class: 'card' },
        h('div', { class: 'card-header' },
          h('div', {},
            h('h2', {}, 'Últimas ventas'),
            h('p', {}, `${ventas.length} venta(s) en total`)),
          linkBtn('#/ventas', 'Ver todas')),
        ultimasVentas.length
          ? dataTable(['Fecha', 'Cliente', 'Vehículo', 'Total'], ultimasVentas,
              v => h('tr', {},
                h('td', { class: 'num' }, fmtFechaHora(v.fechaVenta)),
                h('td', {}, h('span', { class: 'primary-cell' }, v.clienteNombre)),
                h('td', { class: 'mono' }, v.vehiculoPlaca),
                h('td', { class: 'num' }, h('strong', {}, fmtCOP(v.total)))))
          : h('div', { class: 'state-block' },
              h('div', { class: 'state-title' }, 'Aún no hay ventas'),
              h('div', { class: 'state-desc' }, 'Registra la primera venta desde el módulo de Ventas.'))),

      h('div', { class: 'card' },
        h('div', { class: 'card-header' },
          h('div', {},
            h('h2', {}, 'Últimos mantenimientos'),
            h('p', {}, `${mantenimientos.length} registro(s)`)),
          linkBtn('#/mantenimientos', 'Ver todos')),
        ultimosMant.length
          ? dataTable(['Fecha', 'Vehículo', 'Descripción', 'Costo'], ultimosMant,
              m => h('tr', {},
                h('td', { class: 'num' }, fmtFecha(m.fecha)),
                h('td', { class: 'mono' }, m.vehiculoPlaca),
                h('td', {}, h('span', { class: 'primary-cell' }, m.descripcion)),
                h('td', { class: 'num' }, fmtCOP(m.costo))))
          : h('div', { class: 'state-block' },
              h('div', { class: 'state-title' }, 'Sin mantenimientos'),
              h('div', { class: 'state-desc' }, 'Los registros de taller aparecerán aquí.'))),

      h('div', { class: 'card' },
        h('div', { class: 'card-header' },
          h('div', {},
            h('h2', {}, 'Estado del inventario'),
            h('p', {}, 'Distribución por estado')),
          linkBtn('#/vehiculos', 'Ir a vehículos')),
        vehiculos.length
          ? tablaEstados(vehiculos)
          : h('div', { class: 'state-block' },
              h('div', { class: 'state-title' }, 'Inventario vacío'),
              h('div', { class: 'state-desc' }, 'Crea vehículos desde el módulo de Vehículos.'))),

      h('div', { class: 'card' },
        h('div', { class: 'card-header' },
          h('div', {},
            h('h2', {}, 'Accesos rápidos'),
            h('p', {}, 'Atajos a las operaciones más frecuentes'))),
        h('div', { style: 'padding: 16px 18px; display: flex; gap: 10px; flex-wrap: wrap;' },
          h('button', { class: 'btn', onclick: () => { location.hash = '#/ventas'; } },
            h('span', { html: icon('cart') }), 'Nueva venta'),
          h('button', { class: 'btn btn-ghost', onclick: () => { location.hash = '#/vehiculos'; } },
            h('span', { html: icon('car') }), 'Vehículos'),
          h('button', { class: 'btn btn-ghost', onclick: () => { location.hash = '#/clientes'; } },
            h('span', { html: icon('users') }), 'Clientes'),
          h('button', { class: 'btn btn-ghost', onclick: () => { location.hash = '#/mantenimientos'; } },
            h('span', { html: icon('tool') }), 'Mantenimientos')))),

    tasa ? h('p', {
      style: 'margin-top: 18px; font-size: 12.5px; color: var(--text-3);',
    }, `Precios convertidos con la API externa de tasa de cambio (respaldo: ${fmtUSD(1)} ≈ ${fmtCOP(4000)}). Tasa actual: 1 USD = ${fmtCOP(tasa)}.`) : null);
}

function tablaEstados(vehiculos) {
  const conteo = { DISPONIBLE: 0, VENDIDO: 0, EN_MANTENIMIENTO: 0 };
  vehiculos.forEach(v => { conteo[v.estado] = (conteo[v.estado] || 0) + 1; });
  const total = vehiculos.length;

  return h('div', { style: 'padding: 16px 18px; display: grid; gap: 12px;' },
    Object.entries(conteo).map(([estado, cantidad]) =>
      h('div', { style: 'display: flex; align-items: center; gap: 12px;' },
        h('div', { style: 'width: 150px; flex: none;' }, estadoBadge(estado)),
        h('div', {
          style: 'flex: 1; height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden;',
        },
          h('div', {
            style: `width: ${total ? (cantidad / total) * 100 : 0}%; height: 100%; border-radius: 99px; background: ${estado === 'DISPONIBLE' ? 'var(--success)' : estado === 'VENDIDO' ? 'var(--danger)' : 'var(--warning)'};`,
          })),
        h('strong', { class: 'num', style: 'width: 34px; text-align: right;' }, cantidad))));
}
