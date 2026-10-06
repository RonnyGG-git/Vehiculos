package com.vehiculo.vehiculos.exception;

public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }

    public RecursoNoEncontradoException(String recurso, Object id) {
        super(recurso + " no encontrado con id: " + id);
    }
}
