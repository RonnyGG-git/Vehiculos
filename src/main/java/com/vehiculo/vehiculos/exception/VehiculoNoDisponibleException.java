package com.vehiculo.vehiculos.exception;

import com.vehiculo.vehiculos.entity.EstadoVehiculo;

/** El vehículo no está en el estado requerido para la operación (p. ej. vender uno VENDIDO o EN_MANTENIMIENTO). */
public class VehiculoNoDisponibleException extends BusinessException {

    public VehiculoNoDisponibleException(Long vehiculoId, EstadoVehiculo estado) {
        super("El vehículo " + vehiculoId + " no está disponible (estado actual: " + estado + ")");
    }
}
