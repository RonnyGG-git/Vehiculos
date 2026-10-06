package com.vehiculo.vehiculos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Datos que llegan en POST y PUT de /clientes. */
public record ClienteRequest(
        @NotBlank(message = "el nombre es obligatorio")
        @Size(max = 100, message = "el nombre admite máximo 100 caracteres") String nombre,
        @NotBlank(message = "el documento es obligatorio")
        @Pattern(regexp = "^[0-9]{5,15}$", message = "el documento debe tener entre 5 y 15 dígitos") String documento,
        @NotBlank(message = "el email es obligatorio")
        @Email(message = "el email no tiene un formato válido")
        @Size(max = 100, message = "el email admite máximo 100 caracteres") String email,
        @Pattern(regexp = "^$|^[0-9+ ]{7,20}$", message = "el teléfono debe tener entre 7 y 20 dígitos") String telefono) {
}
