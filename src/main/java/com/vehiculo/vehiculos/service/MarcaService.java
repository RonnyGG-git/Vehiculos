package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.MarcaRequest;
import com.vehiculo.vehiculos.dto.MarcaResponse;
import com.vehiculo.vehiculos.entity.Marca;
import com.vehiculo.vehiculos.exception.BusinessException;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.repository.MarcaRepository;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;

    public MarcaService(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    @Transactional(readOnly = true)
    public List<MarcaResponse> listar() {
        return marcaRepository.findAll().stream().map(MarcaResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MarcaResponse buscarPorId(Long id) {
        return MarcaResponse.from(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public Marca obtenerEntidad(Long id) {
        return marcaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Marca", id));
    }

    @Transactional
    public MarcaResponse crear(MarcaRequest request) {
        String nombre = request.nombre().trim();
        Marca porNombre = new Marca();
        porNombre.setNombre(nombre);
        if (marcaRepository.exists(Example.of(porNombre, ExampleMatcher.matching().withIgnoreCase()))) {
            throw new BusinessException("Ya existe la marca " + nombre);
        }
        Marca marca = new Marca();
        marca.setNombre(nombre);
        marca.setPaisOrigen(request.paisOrigen() == null || request.paisOrigen().isBlank()
                ? null : request.paisOrigen().trim());
        return MarcaResponse.from(marcaRepository.save(marca));
    }
}
