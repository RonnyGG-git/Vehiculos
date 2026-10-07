package com.vehiculo.vehiculos.controller;

import com.vehiculo.vehiculos.dto.MarcaRequest;
import com.vehiculo.vehiculos.dto.MarcaResponse;
import com.vehiculo.vehiculos.service.MarcaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marcas")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService) {
        this.marcaService = marcaService;
    }

    @GetMapping
    public List<MarcaResponse> listar() {
        return marcaService.listar();
    }

    @GetMapping("/{id}")
    public MarcaResponse buscarPorId(@PathVariable Long id) {
        return marcaService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarcaResponse crear(@Valid @RequestBody MarcaRequest request) {
        return marcaService.crear(request);
    }
}
