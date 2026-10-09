-- Esquema relacional del concesionario (MySQL 8).
-- Equivale a lo que Hibernate genera desde las entidades JPA (spring.jpa.hibernate.ddl-auto=update),
-- así que NO hace falta ejecutarlo para usar la app: sirve como documentación del modelo relacional
-- o para crear el esquema a mano.
--
-- Uso:  mysql -u root -p < db/00-esquema.sql

CREATE DATABASE IF NOT EXISTS concesionario
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
USE concesionario;

CREATE TABLE IF NOT EXISTS marca (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(60)  NOT NULL,
    pais_origen VARCHAR(60),
    CONSTRAINT pk_marca PRIMARY KEY (id),
    CONSTRAINT uk_marca_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS cliente (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(100) NOT NULL,
    documento VARCHAR(20)  NOT NULL,
    email     VARCHAR(100) NOT NULL,
    telefono  VARCHAR(20),
    CONSTRAINT pk_cliente PRIMARY KEY (id),
    CONSTRAINT uk_cliente_documento UNIQUE (documento),
    CONSTRAINT uk_cliente_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS vehiculo (
    id       BIGINT        NOT NULL AUTO_INCREMENT,
    placa    VARCHAR(15)   NOT NULL,
    modelo   VARCHAR(60)   NOT NULL,
    anio     INT           NOT NULL,
    color    VARCHAR(30),
    precio   DECIMAL(12,2),
    estado   VARCHAR(20)   NOT NULL,
    marca_id BIGINT        NOT NULL,
    CONSTRAINT pk_vehiculo PRIMARY KEY (id),
    CONSTRAINT uk_vehiculo_placa UNIQUE (placa),
    CONSTRAINT ck_vehiculo_estado CHECK (estado IN ('DISPONIBLE', 'VENDIDO', 'EN_MANTENIMIENTO')),
    CONSTRAINT fk_vehiculo_marca FOREIGN KEY (marca_id) REFERENCES marca (id)
);

CREATE TABLE IF NOT EXISTS venta (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    fecha_venta DATETIME(6)   NOT NULL,
    precio_base DECIMAL(14,2) NOT NULL,   -- precio del vehículo al momento de la venta
    descuento   DECIMAL(14,2) NOT NULL,
    total       DECIMAL(14,2) NOT NULL,
    cliente_id  BIGINT        NOT NULL,
    vehiculo_id BIGINT        NOT NULL,
    CONSTRAINT pk_venta PRIMARY KEY (id),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    CONSTRAINT fk_venta_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculo (id)
);

CREATE TABLE IF NOT EXISTS mantenimiento (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    fecha       DATE          NOT NULL,
    descripcion VARCHAR(255)  NOT NULL,
    costo       DECIMAL(12,2),
    vehiculo_id BIGINT        NOT NULL,
    CONSTRAINT pk_mantenimiento PRIMARY KEY (id),
    CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculo (id)
);
