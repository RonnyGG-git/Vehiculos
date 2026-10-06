package com.vehiculo.vehiculos.repository;

import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    Optional<Vehiculo> findByPlaca(String placa);

    boolean existsByPlaca(String placa);

    List<Vehiculo> findByEstado(EstadoVehiculo estado);

    List<Vehiculo> findByMarcaNombreIgnoreCase(String nombre);

    /** Bloqueo de escritura: evita que dos ventas simultáneas tomen el mismo vehículo. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehiculo v where v.id = :id")
    Optional<Vehiculo> findByIdForUpdate(@Param("id") Long id);
}
