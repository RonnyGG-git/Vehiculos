package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.MantenimientoRequest;
import com.vehiculo.vehiculos.dto.MantenimientoResponse;
import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Mantenimiento;
import com.vehiculo.vehiculos.entity.Vehiculo;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.exception.VehiculoNoDisponibleException;
import com.vehiculo.vehiculos.repository.MantenimientoRepository;
import com.vehiculo.vehiculos.repository.VehiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MantenimientoService {

    private final MantenimientoRepository mantenimientoRepository;
    private final VehiculoRepository vehiculoRepository;

    public MantenimientoService(MantenimientoRepository mantenimientoRepository,
                                VehiculoRepository vehiculoRepository) {
        this.mantenimientoRepository = mantenimientoRepository;
        this.vehiculoRepository = vehiculoRepository;
    }

    @Transactional
    public MantenimientoResponse registrar(MantenimientoRequest request) {
        Vehiculo vehiculo = vehiculoRepository.findByIdForUpdate(request.vehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo", request.vehiculoId()));

        // Un vehículo vendido pasaría a EN_MANTENIMIENTO y dejaría de figurar como vendido.
        if (vehiculo.getEstado() == EstadoVehiculo.VENDIDO) {
            throw new VehiculoNoDisponibleException(vehiculo.getId(), vehiculo.getEstado());
        }

        Mantenimiento m = new Mantenimiento();
        m.setVehiculo(vehiculo);
        m.setDescripcion(request.descripcion());
        m.setCosto(request.costo());
        m.setFecha(request.fecha() != null ? request.fecha() : LocalDate.now());

        vehiculo.setEstado(EstadoVehiculo.EN_MANTENIMIENTO);
        return MantenimientoResponse.from(mantenimientoRepository.save(m));
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponse> listar() {
        return mantenimientoRepository.findAll().stream().map(MantenimientoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MantenimientoResponse> historialPorVehiculo(Long vehiculoId) {
        if (!vehiculoRepository.existsById(vehiculoId)) {
            throw new RecursoNoEncontradoException("Vehículo", vehiculoId);
        }
        return mantenimientoRepository.findByVehiculoId(vehiculoId).stream()
                .map(MantenimientoResponse::from).toList();
    }
}
