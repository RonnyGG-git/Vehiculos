package com.vehiculo.vehiculos.controller;

import com.vehiculo.vehiculos.dto.VehiculoRequest;
import com.vehiculo.vehiculos.dto.VehiculoResponse;
import com.vehiculo.vehiculos.service.VehiculoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    @GetMapping
    public List<VehiculoResponse> listar() {
        return vehiculoService.listar();
    }

    @GetMapping("/disponibles")
    public List<VehiculoResponse> listarDisponibles() {
        return vehiculoService.listarDisponibles();
    }

    @GetMapping("/marca/{marca}")
    public List<VehiculoResponse> listarPorMarca(@PathVariable String marca) {
        return vehiculoService.listarPorMarca(marca);
    }

    @GetMapping("/{id}")
    public VehiculoResponse buscarPorId(@PathVariable Long id) {
        return vehiculoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehiculoResponse crear(@Valid @RequestBody VehiculoRequest request) {
        return vehiculoService.crear(request);
    }

    @PutMapping("/{id}")
    public VehiculoResponse actualizar(@PathVariable Long id, @Valid @RequestBody VehiculoRequest request) {
        return vehiculoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        vehiculoService.eliminar(id);
    }
}
