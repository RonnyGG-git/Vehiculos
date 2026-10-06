package com.vehiculo.vehiculos.exception;

/** Violación de una regla de negocio (p. ej. vender un vehículo ya vendido). */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
