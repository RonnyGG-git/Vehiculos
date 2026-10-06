package com.vehiculo.vehiculos.dto;

import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Incluye el precio en COP y su conversión a USD con la tasa de la API externa. */
public record VehiculoResponse(
        Long id,
        String placa,
        Long marcaId,
        String marca,
        String modelo,
        Integer anio,
        String color,
        BigDecimal precioCop,
        BigDecimal precioUsd,
        BigDecimal tasaCambioCopPorUsd,
        EstadoVehiculo estado) {

    public static VehiculoResponse from(Vehiculo v, BigDecimal tasaCopPorUsd) {
        BigDecimal precioUsd = v.getPrecio() == null ? null
                : v.getPrecio().divide(tasaCopPorUsd, 2, RoundingMode.HALF_UP);
        return new VehiculoResponse(v.getId(), v.getPlaca(), v.getMarca().getId(), v.getMarca().getNombre(),
                v.getModelo(), v.getAnio(), v.getColor(), v.getPrecio(), precioUsd, tasaCopPorUsd, v.getEstado());
    }
}
