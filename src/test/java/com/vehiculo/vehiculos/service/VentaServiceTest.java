package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.VentaRequest;
import com.vehiculo.vehiculos.dto.VentaResponse;
import com.vehiculo.vehiculos.entity.Cliente;
import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Vehiculo;
import com.vehiculo.vehiculos.entity.Venta;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.exception.VehiculoNoDisponibleException;
import com.vehiculo.vehiculos.repository.ClienteRepository;
import com.vehiculo.vehiculos.repository.VehiculoRepository;
import com.vehiculo.vehiculos.repository.VentaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VentaServiceTest {

    private VentaRepository ventaRepository;
    private ClienteRepository clienteRepository;
    private VehiculoRepository vehiculoRepository;
    private VentaService service;

    @BeforeEach
    void setUp() {
        ventaRepository = Mockito.mock(VentaRepository.class);
        clienteRepository = Mockito.mock(ClienteRepository.class);
        vehiculoRepository = Mockito.mock(VehiculoRepository.class);
        service = new VentaService(ventaRepository, clienteRepository, vehiculoRepository);

        Cliente c = new Cliente();
        c.setNombre("Ana");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(c));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(i -> i.getArgument(0));
    }

    private Vehiculo vehiculo(String precio, EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setPlaca("ABC123");
        v.setPrecio(new BigDecimal(precio));
        v.setEstado(estado);
        when(vehiculoRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(v));
        return v;
    }

    @Test
    void sinDescuentoEnElUmbralExacto() {
        Vehiculo v = vehiculo("100000000", EstadoVehiculo.DISPONIBLE);
        VentaResponse r = service.registrar(new VentaRequest(1L, 10L));
        assertEquals(0, r.descuento().compareTo(BigDecimal.ZERO));
        assertEquals(0, r.total().compareTo(new BigDecimal("100000000")));
        assertEquals(EstadoVehiculo.VENDIDO, v.getEstado());
        assertNotNull(r.fechaVenta());
    }

    @Test
    void descuentoDel5PorCientoSobreElUmbral() {
        vehiculo("120000000", EstadoVehiculo.DISPONIBLE);
        VentaResponse r = service.registrar(new VentaRequest(1L, 10L));
        assertEquals(0, r.descuento().compareTo(new BigDecimal("6000000")));
        assertEquals(0, r.total().compareTo(new BigDecimal("114000000")));
    }

    @Test
    void noVendeVehiculoVendidoNiEnMantenimiento() {
        for (EstadoVehiculo e : new EstadoVehiculo[]{EstadoVehiculo.VENDIDO, EstadoVehiculo.EN_MANTENIMIENTO}) {
            Vehiculo v = vehiculo("50000000", e);
            assertThrows(VehiculoNoDisponibleException.class, () -> service.registrar(new VentaRequest(1L, 10L)));
            assertEquals(e, v.getEstado());
        }
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void clienteInexistenteLanzaRecursoNoEncontrado() {
        assertThrows(RecursoNoEncontradoException.class, () -> service.registrar(new VentaRequest(99L, 10L)));
    }
}
