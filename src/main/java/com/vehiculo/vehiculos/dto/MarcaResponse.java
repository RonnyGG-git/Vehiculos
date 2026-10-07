package com.vehiculo.vehiculos.dto;

import com.vehiculo.vehiculos.entity.Marca;

public record MarcaResponse(Long id, String nombre, String paisOrigen) {

    public static MarcaResponse from(Marca m) {
        return new MarcaResponse(m.getId(), m.getNombre(), m.getPaisOrigen());
    }
}
