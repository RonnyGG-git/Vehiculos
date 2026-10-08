package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.VentaRequest;
import com.vehiculo.vehiculos.dto.VentaResponse;
import com.vehiculo.vehiculos.entity.Cliente;
import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;
import com.vehiculo.vehiculos.entity.Venta;
import com.vehiculo.vehiculos.exception.BusinessException;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.exception.VehiculoNoDisponibleException;
import com.vehiculo.vehiculos.repository.ClienteRepository;
import com.vehiculo.vehiculos.repository.VehiculoRepository;
import com.vehiculo.vehiculos.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class VentaService {

    static final BigDecimal UMBRAL_DESCUENTO = new BigDecimal("100000000");
    static final BigDecimal PORCENTAJE_DESCUENTO = new BigDecimal("0.05");

    private final VentaRepository ventaRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;

    public VentaService(VentaRepository ventaRepository, ClienteRepository clienteRepository,
                        VehiculoRepository vehiculoRepository) {
        this.ventaRepository = ventaRepository;
        this.clienteRepository = clienteRepository;
        this.vehiculoRepository = vehiculoRepository;
    }

    @Transactional
    public VentaResponse registrar(VentaRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", request.clienteId()));
        // Con bloqueo: dos ventas simultáneas del mismo vehículo se serializan.
        Vehiculo vehiculo = vehiculoRepository.findByIdForUpdate(request.vehiculoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Vehículo", request.vehiculoId()));

        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE) {
            throw new VehiculoNoDisponibleException(vehiculo.getId(), vehiculo.getEstado());
        }
        if (vehiculo.getPrecio() == null) {
            throw new BusinessException("El vehículo " + vehiculo.getId() + " no tiene precio definido");
        }

        BigDecimal precioBase = vehiculo.getPrecio();
        BigDecimal descuento = calcularDescuento(precioBase);

        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setVehiculo(vehiculo);
        // MySQL DATETIME(6) guarda microsegundos; truncar evita que la respuesta difiera de lo persistido.
        venta.setFechaVenta(LocalDateTime.now().truncatedTo(ChronoUnit.MICROS));
        venta.setPrecioBase(precioBase);
        venta.setDescuento(descuento);
        venta.setTotal(precioBase.subtract(descuento));

        vehiculo.setEstado(EstadoVehiculo.VENDIDO);
        return VentaResponse.from(ventaRepository.save(venta));
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listar() {
        return ventaRepository.findAll().stream().map(VentaResponse::from).toList();
    }

    /** 5 % solo si el precio supera (estrictamente) $100.000.000 COP. */
    static BigDecimal calcularDescuento(BigDecimal precio) {
        if (precio.compareTo(UMBRAL_DESCUENTO) > 0) {
            return precio.multiply(PORCENTAJE_DESCUENTO).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO.setScale(2);
    }
}
