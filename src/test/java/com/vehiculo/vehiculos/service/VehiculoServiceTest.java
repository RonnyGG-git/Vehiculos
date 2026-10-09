package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.VehiculoResponse;
import com.vehiculo.vehiculos.entity.EstadoVehiculo;
import com.vehiculo.vehiculos.entity.Marca;
import com.vehiculo.vehiculos.entity.Vehiculo;
import com.vehiculo.vehiculos.exception.BusinessException;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.repository.VehiculoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VehiculoServiceTest {

    private VehiculoRepository vehiculoRepository;
    private MarcaService marcaService;
    private TasaCambioService tasaCambioService;
    private VehiculoService service;

    @BeforeEach
    void setUp() {
        vehiculoRepository = Mockito.mock(VehiculoRepository.class);
        marcaService = Mockito.mock(MarcaService.class);
        tasaCambioService = Mockito.mock(TasaCambioService.class);
        service = new VehiculoService(vehiculoRepository, marcaService, tasaCambioService);
        when(vehiculoRepository.save(any(Vehiculo.class))).thenAnswer(i -> i.getArgument(0));
        when(tasaCambioService.obtenerTasaCopPorUsd()).thenReturn(new BigDecimal("4000"));
    }

    private Vehiculo vehiculo(Long id, EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setId(id);
        v.setPlaca("ABC123");
        v.setModelo("Corolla");
        v.setAnio(2024);
        v.setPrecio(new BigDecimal("80000000"));
        v.setEstado(estado);
        Marca marca = new Marca();
        marca.setId(1L);
        marca.setNombre("Toyota");
        v.setMarca(marca);
        when(vehiculoRepository.findById(id)).thenReturn(Optional.of(v));
        return v;
    }

    @Test
    void salirTallerPasaDeEnMantenimientoADisponible() {
        Vehiculo v = vehiculo(6L, EstadoVehiculo.EN_MANTENIMIENTO);
        VehiculoResponse r = service.salirTaller(6L);
        assertEquals(EstadoVehiculo.DISPONIBLE, v.getEstado());
        assertEquals(EstadoVehiculo.DISPONIBLE, r.estado());
        verify(vehiculoRepository).save(v);
    }

    @Test
    void salirTallerNoPermiteVehiculoVendido() {
        Vehiculo v = vehiculo(7L, EstadoVehiculo.VENDIDO);
        assertThrows(BusinessException.class, () -> service.salirTaller(7L));
        assertEquals(EstadoVehiculo.VENDIDO, v.getEstado());
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void salirTallerNoPermiteVehiculoYaDisponible() {
        vehiculo(8L, EstadoVehiculo.DISPONIBLE);
        assertThrows(BusinessException.class, () -> service.salirTaller(8L));
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void salirTallerVehiculoInexistenteLanza404() {
        when(vehiculoRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> service.salirTaller(99L));
    }
}
