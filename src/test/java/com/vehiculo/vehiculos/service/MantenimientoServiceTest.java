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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MantenimientoServiceTest {

    private MantenimientoRepository mantenimientoRepository;
    private VehiculoRepository vehiculoRepository;
    private MantenimientoService service;

    @BeforeEach
    void setUp() {
        mantenimientoRepository = Mockito.mock(MantenimientoRepository.class);
        vehiculoRepository = Mockito.mock(VehiculoRepository.class);
        service = new MantenimientoService(mantenimientoRepository, vehiculoRepository);
        when(mantenimientoRepository.save(any(Mantenimiento.class))).thenAnswer(i -> i.getArgument(0));
    }

    private Vehiculo vehiculo(EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setPlaca("TLR006");
        v.setEstado(estado);
        when(vehiculoRepository.findByIdForUpdate(6L)).thenReturn(Optional.of(v));
        return v;
    }

    @Test
    void registraYDejaElVehiculoEnMantenimientoConCostoDe2Decimales() {
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        MantenimientoResponse r = service.registrar(new MantenimientoRequest(6L, "Aceite", new BigDecimal("150000"), null));
        assertEquals(EstadoVehiculo.EN_MANTENIMIENTO, v.getEstado());
        assertEquals("150000.00", r.costo().toPlainString());
        assertEquals(LocalDate.now(), r.fecha());
    }

    @Test
    void costoOpcionalQuedaNulo() {
        vehiculo(EstadoVehiculo.DISPONIBLE);
        assertNull(service.registrar(new MantenimientoRequest(6L, "Revision", null, null)).costo());
    }

    @Test
    void noRegistraSobreVehiculoVendido() {
        Vehiculo v = vehiculo(EstadoVehiculo.VENDIDO);
        assertThrows(VehiculoNoDisponibleException.class,
                () -> service.registrar(new MantenimientoRequest(6L, "X", null, null)));
        assertEquals(EstadoVehiculo.VENDIDO, v.getEstado());
        verify(mantenimientoRepository, never()).save(any());
    }

    @Test
    void historialDeVehiculoInexistenteLanza404() {
        when(vehiculoRepository.existsById(99L)).thenReturn(false);
        assertThrows(RecursoNoEncontradoException.class, () -> service.historialPorVehiculo(99L));
    }
}
