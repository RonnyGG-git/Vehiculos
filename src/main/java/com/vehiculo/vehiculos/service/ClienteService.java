package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.dto.ClienteRequest;
import com.vehiculo.vehiculos.dto.ClienteResponse;
import com.vehiculo.vehiculos.entity.Cliente;
import com.vehiculo.vehiculos.exception.BusinessException;
import com.vehiculo.vehiculos.exception.RecursoNoEncontradoException;
import com.vehiculo.vehiculos.repository.ClienteRepository;
import org.springframework.data.domain.Example;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll().stream().map(ClienteResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return ClienteResponse.from(obtenerEntidad(id));
    }

    /** Para uso interno y del módulo de Ventas. */
    @Transactional(readOnly = true)
    public Cliente obtenerEntidad(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente", id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        Cliente cliente = new Cliente();
        aplicarDatos(cliente, request);
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = obtenerEntidad(id);
        aplicarDatos(cliente, request);
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = obtenerEntidad(id);
        if (!cliente.getVentas().isEmpty()) {
            throw new BusinessException("No se puede eliminar el cliente " + id + " porque tiene ventas registradas");
        }
        clienteRepository.delete(cliente);
    }

    /** Regla de negocio: email único (sin distinguir mayúsculas). El documento también es único en la BD. */
    private void aplicarDatos(Cliente cliente, ClienteRequest request) {
        String email = request.email().trim().toLowerCase();
        String documento = request.documento().trim();

        clienteRepository.findByEmail(email)
                .filter(otro -> !otro.getId().equals(cliente.getId()))
                .ifPresent(otro -> {
                    throw new BusinessException("Ya existe un cliente con el email " + email);
                });
        // Consulta por ejemplo: evita tocar ClienteRepository, que es compartido con Ventas.
        Cliente porDocumento = new Cliente();
        porDocumento.setDocumento(documento);
        clienteRepository.findOne(Example.of(porDocumento))
                .filter(otro -> !otro.getId().equals(cliente.getId()))
                .ifPresent(otro -> {
                    throw new BusinessException("Ya existe un cliente con el documento " + documento);
                });

        cliente.setNombre(request.nombre().trim());
        cliente.setDocumento(documento);
        cliente.setEmail(email);
        cliente.setTelefono(request.telefono() == null || request.telefono().isBlank() ? null : request.telefono().trim());
    }
}
