package com.vehiculo.vehiculos.dto;

import jakarta.validation.constraints.NotNull;

/** La fecha, el descuento y el total los calcula el servidor. */
public record VentaRequest(
        @NotNull(message = "clienteId es obligatorio") Long clienteId,
        @NotNull(message = "vehiculoId es obligatorio") Long vehiculoId) {
}
