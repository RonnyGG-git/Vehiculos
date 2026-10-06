package com.vehiculo.vehiculos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarcaRequest(
        @NotBlank(message = "el nombre es obligatorio")
        @Size(max = 60, message = "el nombre admite máximo 60 caracteres") String nombre,
        @Size(max = 60, message = "el país de origen admite máximo 60 caracteres") String paisOrigen) {
}
