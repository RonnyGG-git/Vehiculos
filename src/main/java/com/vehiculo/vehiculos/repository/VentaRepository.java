package com.vehiculo.vehiculos.repository;

import com.vehiculo.vehiculos.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VentaRepository extends JpaRepository<Venta, Long> {
}
