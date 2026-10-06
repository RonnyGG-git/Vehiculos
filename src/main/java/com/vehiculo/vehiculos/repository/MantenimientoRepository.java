package com.vehiculo.vehiculos.repository;

import com.vehiculo.vehiculos.entity.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Long> {

    List<Mantenimiento> findByVehiculoId(Long vehiculoId);
}
