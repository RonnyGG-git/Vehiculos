-- Crea la base de datos de AutoDrive Motors.
-- Las tablas (marca, cliente, vehiculo, venta, mantenimiento) las crea Hibernate
-- al arrancar la app (spring.jpa.hibernate.ddl-auto=update).
--
-- Uso:  mysqlsh --sql -h 127.0.0.1 -u root -p -f db/01-crear-bd.sql

CREATE DATABASE IF NOT EXISTS autodrive_motors
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
