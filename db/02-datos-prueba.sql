-- Datos de prueba para autodrive_motors. REINICIA los datos: borra ventas,
-- mantenimientos, vehiculos, clientes y marcas y los vuelve a insertar.
-- Las tablas ya deben existir (arranca la app una vez, o corre ./mvnw test).
--
-- Uso:  mysqlsh --sql -h 127.0.0.1 -u root -p -f db/02-datos-prueba.sql

USE autodrive_motors;

DELETE FROM venta;
DELETE FROM mantenimiento;
DELETE FROM vehiculo;
DELETE FROM cliente;
DELETE FROM marca;

INSERT INTO marca (id, nombre, pais_origen) VALUES
    (1, 'Toyota', 'Japon'),
    (2, 'Mercedes-Benz', 'Alemania');

INSERT INTO cliente (id, nombre, documento, email, telefono) VALUES
    (1, 'Ana Perez', '1001', 'ana@mail.com', '3001112222');

-- id | placa | modelo | anio | color | precio | estado | marca
INSERT INTO vehiculo (id, placa, modelo, anio, color, precio, estado, marca_id) VALUES
    (1, 'ABC123', 'Corolla',  2024, 'Blanco', 80000000.00,  'DISPONIBLE',       1),  -- sin descuento
    (2, 'LUX777', 'Clase C',  2025, 'Negro',  120000000.00, 'DISPONIBLE',       2),  -- 5% de descuento
    (3, 'OLD001', 'Hilux',    2020, 'Gris',   150000000.00, 'VENDIDO',          1),  -- no vendible
    (4, 'MNT002', 'Yaris',    2023, 'Rojo',   60000000.00,  'EN_MANTENIMIENTO', 1),  -- no vendible
    (5, 'LIM100', 'Prado',    2024, 'Verde',  100000000.00, 'DISPONIBLE',       1),  -- limite exacto: sin descuento
    (6, 'TLR006', 'Aveo',     2022, 'Azul',   40000000.00,  'DISPONIBLE',       1);  -- para probar mantenimiento
