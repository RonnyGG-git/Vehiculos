package com.vehiculo.vehiculos.repository;

import com.vehiculo.vehiculos.entity.Propietario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PropietarioRepository extends JpaRepository<Propietario, Long> {

    Optional<Propietario> findByDocumento(String documento);
}
