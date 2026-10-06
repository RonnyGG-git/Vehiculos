package com.vehiculo.vehiculos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MantenimientoRequest(
        @NotNull(message = "vehiculoId es obligatorio") Long vehiculoId,
        @NotBlank(message = "la descripción es obligatoria")
        @Size(max = 255, message = "la descripción admite máximo 255 caracteres") String descripcion,
        @PositiveOrZero(message = "el costo no puede ser negativo") BigDecimal costo,
        /** Opcional: si no se envía se usa la fecha actual. */
        LocalDate fecha) {
}
