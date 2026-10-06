package com.vehiculo.vehiculos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "propietario")
@Getter
@Setter
@NoArgsConstructor
public class Propietario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String documento;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String telefono;

    @OneToMany(mappedBy = "propietario")
    private List<Vehiculo> vehiculos = new ArrayList<>();
}
