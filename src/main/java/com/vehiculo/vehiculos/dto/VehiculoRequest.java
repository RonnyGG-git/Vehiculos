package com.vehiculo.vehiculos.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Datos que llegan en POST y PUT de /vehiculos.
 * El estado no se recibe: al crear siempre es DISPONIBLE y lo cambian Ventas/Mantenimientos.
 */
public record VehiculoRequest(
        @NotBlank(message = "la placa es obligatoria")
        @Pattern(regexp = "^[A-Za-z]{3}-?[0-9]{2}[A-Za-z0-9]$",
                message = "la placa debe tener formato ABC123 (carro) o ABC12D (moto)") String placa,
        @NotNull(message = "marcaId es obligatorio") Long marcaId,
        @NotBlank(message = "el modelo es obligatorio")
        @Size(max = 60, message = "el modelo admite máximo 60 caracteres") String modelo,
        @NotNull(message = "el año es obligatorio")
        @Min(value = 1950, message = "el año mínimo es 1950")
        @Max(value = 2100, message = "el año máximo es 2100") Integer anio,
        @Size(max = 30, message = "el color admite máximo 30 caracteres") String color,
        /** Precio en pesos colombianos (COP). */
        @NotNull(message = "el precio es obligatorio")
        @PositiveOrZero(message = "el precio no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "el precio admite máximo 10 enteros y 2 decimales") BigDecimal precio) {
}
