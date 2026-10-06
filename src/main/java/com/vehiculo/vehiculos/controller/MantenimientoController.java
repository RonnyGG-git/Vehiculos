package com.vehiculo.vehiculos.controller;

import com.vehiculo.vehiculos.dto.MantenimientoRequest;
import com.vehiculo.vehiculos.dto.MantenimientoResponse;
import com.vehiculo.vehiculos.service.MantenimientoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mantenimientos")
public class MantenimientoController {

    private final MantenimientoService mantenimientoService;

    public MantenimientoController(MantenimientoService mantenimientoService) {
        this.mantenimientoService = mantenimientoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MantenimientoResponse registrar(@Valid @RequestBody MantenimientoRequest request) {
        return mantenimientoService.registrar(request);
    }

    @GetMapping
    public List<MantenimientoResponse> listar() {
        return mantenimientoService.listar();
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    public List<MantenimientoResponse> historialPorVehiculo(@PathVariable Long vehiculoId) {
        return mantenimientoService.historialPorVehiculo(vehiculoId);
    }
}
