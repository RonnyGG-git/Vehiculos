package com.vehiculo.vehiculos.dto;

import com.vehiculo.vehiculos.entity.Mantenimiento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MantenimientoResponse(
        Long id,
        LocalDate fecha,
        String descripcion,
        BigDecimal costo,
        Long vehiculoId,
        String vehiculoPlaca) {

    public static MantenimientoResponse from(Mantenimiento m) {
        return new MantenimientoResponse(m.getId(), m.getFecha(), m.getDescripcion(), m.getCosto(),
                m.getVehiculo().getId(), m.getVehiculo().getPlaca());
    }
}
