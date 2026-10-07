package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.VehiculoRequest;
import com.vehiculo.vehiculos.dto.VehiculoResponse;
import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;
import com.vehiculo.vehiculos.exception.BusinessException;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.repository.VehiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final MarcaService marcaService;
    private final TasaCambioService tasaCambioService;

    public VehiculoService(VehiculoRepository vehiculoRepository, MarcaService marcaService,
                           TasaCambioService tasaCambioService) {
        this.vehiculoRepository = vehiculoRepository;
        this.marcaService = marcaService;
        this.tasaCambioService = tasaCambioService;
    }

    @Transactional(readOnly = true)
    public List<VehiculoResponse> listar() {
        return aResponses(vehiculoRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<VehiculoResponse> listarDisponibles() {
        return aResponses(vehiculoRepository.findByEstado(EstadoVehiculo.DISPONIBLE));
    }

    /** Busca por el nombre de la marca, sin distinguir mayúsculas. */
    @Transactional(readOnly = true)
    public List<VehiculoResponse> listarPorMarca(String nombreMarca) {
        return aResponses(vehiculoRepository.findByMarcaNombreIgnoreCase(nombreMarca.trim()));
    }

    @Transactional(readOnly = true)
    public VehiculoResponse buscarPorId(Long id) {
        return VehiculoResponse.from(obtenerEntidad(id), tasaCambioService.obtenerTasaCopPorUsd());
    }

    /** Para uso interno y de los módulos de Ventas y Mantenimientos. */
    @Transactional(readOnly = true)
    public Vehiculo obtenerEntidad(Long id) {
        return vehiculoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo", id));
    }

    /**
     * Para Ventas y Mantenimientos: cambio de estado del vehículo
     * (VENDIDO al vender, EN_MANTENIMIENTO al ingresar a taller, DISPONIBLE al salir).
     */
    @Transactional
    public Vehiculo cambiarEstado(Long id, EstadoVehiculo nuevoEstado) {
        Vehiculo vehiculo = obtenerEntidad(id);
        vehiculo.setEstado(nuevoEstado);
        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public VehiculoResponse crear(VehiculoRequest request) {
        Vehiculo vehiculo = new Vehiculo();
        aplicarDatos(vehiculo, request);
        vehiculo.setEstado(EstadoVehiculo.DISPONIBLE);
        return VehiculoResponse.from(vehiculoRepository.save(vehiculo), tasaCambioService.obtenerTasaCopPorUsd());
    }

    @Transactional
    public VehiculoResponse actualizar(Long id, VehiculoRequest request) {
        Vehiculo vehiculo = obtenerEntidad(id);
        aplicarDatos(vehiculo, request);
        return VehiculoResponse.from(vehiculoRepository.save(vehiculo), tasaCambioService.obtenerTasaCopPorUsd());
    }

    @Transactional
    public void eliminar(Long id) {
        Vehiculo vehiculo = obtenerEntidad(id);
        if (vehiculo.getEstado() == EstadoVehiculo.VENDIDO) {
            throw new BusinessException("No se puede eliminar el vehículo " + id + " porque ya fue vendido");
        }
        vehiculoRepository.delete(vehiculo);
        // Forzar el DELETE aquí para que una referencia desde otra tabla responda 409 y no 500.
        vehiculoRepository.flush();
    }

    private void aplicarDatos(Vehiculo vehiculo, VehiculoRequest request) {
        // Regla de negocio: precio no negativo (también validado con @PositiveOrZero en el DTO).
        if (request.precio().signum() < 0) {
            throw new BusinessException("El precio no puede ser negativo");
        }
        // Regla de negocio: placa única. Se guarda sin guion y en mayúsculas.
        String placa = request.placa().trim().replace("-", "").toUpperCase();
        vehiculoRepository.findByPlaca(placa)
                .filter(otro -> !otro.getId().equals(vehiculo.getId()))
                .ifPresent(otro -> {
                    throw new BusinessException("Ya existe un vehículo con la placa " + placa);
                });

        vehiculo.setPlaca(placa);
        vehiculo.setMarca(marcaService.obtenerEntidad(request.marcaId()));
        vehiculo.setModelo(request.modelo().trim());
        vehiculo.setAnio(request.anio());
        vehiculo.setColor(request.color() == null || request.color().isBlank() ? null : request.color().trim());
        vehiculo.setPrecio(request.precio());
    }

    private List<VehiculoResponse> aResponses(List<Vehiculo> vehiculos) {
        BigDecimal tasa = tasaCambioService.obtenerTasaCopPorUsd();
        return vehiculos.stream().map(v -> VehiculoResponse.from(v, tasa)).toList();
    }
}
