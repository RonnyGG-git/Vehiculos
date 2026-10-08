package com.vehiculo.vehiculos.controller;

import com.vehiculo.vehiculos.dto.VentaRequest;
import com.vehiculo.vehiculos.dto.VentaResponse;
import com.vehiculo.vehiculos.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse registrar(@Valid @RequestBody VentaRequest request) {
        return ventaService.registrar(request);
    }

    @GetMapping
    public List<VentaResponse> listar() {
        return ventaService.listar();
    }
}
