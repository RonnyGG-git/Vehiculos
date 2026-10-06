package com.vehiculo.vehiculos.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Formato único de error JSON de la API.
 * {@code details} solo se llena en errores de validación (un item por campo).
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details) {
}
