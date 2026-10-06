package com.vehiculo.vehiculos.repository;

import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    Optional<Vehiculo> findByPlaca(String placa);

    boolean existsByPlaca(String placa);

    List<Vehiculo> findByEstado(EstadoVehiculo estado);
}
