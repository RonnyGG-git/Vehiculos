package com.vehiculo.vehiculos.dto;

import com.vehiculo.vehiculos.entity.Venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VentaResponse(
        Long id,
        LocalDateTime fechaVenta,
        Long clienteId,
        String clienteNombre,
        Long vehiculoId,
        String vehiculoPlaca,
        BigDecimal precioBase,
        BigDecimal descuento,
        BigDecimal total) {

    public static VentaResponse from(Venta v) {
        return new VentaResponse(v.getId(), v.getFechaVenta(),
                v.getCliente().getId(), v.getCliente().getNombre(),
                v.getVehiculo().getId(), v.getVehiculo().getPlaca(),
                v.getPrecioBase(), v.getDescuento(), v.getTotal());
    }
}
