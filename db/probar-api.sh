#!/usr/bin/env bash
# Prueba de punta a punta de Ventas y Mantenimientos.
# Requisitos: app corriendo en localhost:8080 y datos de prueba (db/02-datos-prueba.sql).
# Uso: bash db/probar-api.sh
BASE=${BASE:-http://localhost:8080}

# $1 = titulo, $2 = metodo, $3 = ruta, $4 = body JSON (opcional)
req() {
  echo; echo "=== $1"
  echo "--> $2 $3 ${4:-}"
  if [ -n "${4:-}" ]; then
    curl -s -X "$2" "$BASE$3" -H "Content-Type: application/json" -d "$4" -w "\n<-- HTTP %{http_code}\n"
  else
    curl -s -X "$2" "$BASE$3" -w "\n<-- HTTP %{http_code}\n"
  fi
}

req "1. Venta con descuento 5% (Clase C 120M -> total 114M)  [espera 201]" POST /ventas '{"clienteId":1,"vehiculoId":2}'
req "2. Venta sin descuento (Corolla 80M -> total 80M)         [espera 201]" POST /ventas '{"clienteId":1,"vehiculoId":1}'
req "3. Limite exacto 100M: NO supera, sin descuento           [espera 201]" POST /ventas '{"clienteId":1,"vehiculoId":5}'
req "4. Vender de nuevo un vehiculo ya vendido                 [espera 409]" POST /ventas '{"clienteId":1,"vehiculoId":1}'
req "5. Vender un vehiculo EN_MANTENIMIENTO                    [espera 409]" POST /ventas '{"clienteId":1,"vehiculoId":4}'
req "6. Cliente inexistente                                    [espera 404]" POST /ventas '{"clienteId":99,"vehiculoId":6}'
req "7. Body sin ids (validacion)                              [espera 400]" POST /ventas '{}'
req "8. Listar ventas                                          [espera 200, 3 ventas]" GET /ventas

req "9. Registrar mantenimiento al Aveo (id 6)                 [espera 201]" POST /mantenimientos '{"vehiculoId":6,"descripcion":"Cambio de aceite","costo":150000}'
req "10. Vender el Aveo, que ahora esta EN_MANTENIMIENTO       [espera 409]" POST /ventas '{"clienteId":1,"vehiculoId":6}'
req "11. Mantenimiento a un vehiculo VENDIDO (Hilux id 3)      [espera 409]" POST /mantenimientos '{"vehiculoId":3,"descripcion":"Revision"}'
req "12. Mantenimiento con costo negativo                      [espera 400]" POST /mantenimientos '{"vehiculoId":6,"descripcion":"X","costo":-5}'
req "13. Historial del Aveo                                    [espera 200, 1 item]" GET /mantenimientos/vehiculo/6
req "14. Historial de vehiculo inexistente                     [espera 404]" GET /mantenimientos/vehiculo/99
req "15. Listar todos los mantenimientos                       [espera 200]" GET /mantenimientos
echo
