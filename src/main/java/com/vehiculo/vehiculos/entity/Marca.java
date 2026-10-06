package com.vehiculo.vehiculos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marca")
@Getter
@Setter
@NoArgsConstructor
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String nombre;

    @Column(name = "pais_origen", length = 60)
    private String paisOrigen;

    @OneToMany(mappedBy = "marca")
    private List<Vehiculo> vehiculos = new ArrayList<>();
}
