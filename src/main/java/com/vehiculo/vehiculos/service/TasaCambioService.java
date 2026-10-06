package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.client.TasaCambioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Tasa de cambio COP por USD con caché en memoria.
 * Si la API falla se usa la última tasa conocida y, si nunca respondió, el valor de respaldo.
 */
@Service
public class TasaCambioService {

    private static final Logger log = LoggerFactory.getLogger(TasaCambioService.class);

    private final TasaCambioClient client;
    private final BigDecimal tasaRespaldo;
    private final Duration vigenciaCache;
    private final Clock clock;

    /** Tras un fallo de la API no se reintenta antes de este tiempo, para no hacer esperar cada petición. */
    private static final Duration ESPERA_TRAS_FALLO = Duration.ofMinutes(1);

    private BigDecimal tasaEnCache;
    private Instant obtenidaEn;
    private Instant reintentarDesde = Instant.MIN;

    @Autowired
    public TasaCambioService(TasaCambioClient client,
                             @Value("${tasa-cambio.respaldo}") BigDecimal tasaRespaldo,
                             @Value("${tasa-cambio.minutos-cache:60}") long minutosCache) {
        this(client, tasaRespaldo, Duration.ofMinutes(minutosCache), Clock.systemUTC());
    }

    /** Para pruebas: permite controlar el reloj. */
    TasaCambioService(TasaCambioClient client, BigDecimal tasaRespaldo, Duration vigenciaCache, Clock clock) {
        this.client = client;
        this.tasaRespaldo = tasaRespaldo;
        this.vigenciaCache = vigenciaCache;
        this.clock = clock;
    }

    /** @return pesos colombianos por 1 dólar. */
    public synchronized BigDecimal obtenerTasaCopPorUsd() {
        Instant ahora = clock.instant();
        if (tasaEnCache != null && obtenidaEn.plus(vigenciaCache).isAfter(ahora)) {
            return tasaEnCache;
        }
        if (ahora.isBefore(reintentarDesde)) {
            return tasaDeRespaldo();
        }
        return client.consultarCopPorUsd()
                .map(tasa -> {
                    tasaEnCache = tasa;
                    obtenidaEn = ahora;
                    log.info("Tasa de cambio actualizada: 1 USD = {} COP", tasa);
                    return tasa;
                })
                .orElseGet(() -> {
                    reintentarDesde = ahora.plus(ESPERA_TRAS_FALLO);
                    return tasaDeRespaldo();
                });
    }

    /** Última tasa conocida o, si la API nunca respondió, el valor configurado. */
    private BigDecimal tasaDeRespaldo() {
        return tasaEnCache != null ? tasaEnCache : tasaRespaldo;
    }
}
