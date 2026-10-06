package com.vehiculo.vehiculos.dto;

import com.vehiculo.vehiculos.entity.Cliente;

public record ClienteResponse(
        Long id,
        String nombre,
        String documento,
        String email,
        String telefono) {

    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNombre(), c.getDocumento(), c.getEmail(), c.getTelefono());
    }
}
