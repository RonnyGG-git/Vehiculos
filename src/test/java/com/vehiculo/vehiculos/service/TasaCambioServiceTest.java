package com.vehiculo.vehiculos.service;

import com.vehiculo.vehiculos.client.TasaCambioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class TasaCambioServiceTest {

    private static final BigDecimal RESPALDO = new BigDecimal("4000");

    private TasaCambioClient client;
    private MutableClock clock;
    private TasaCambioService service;

    @BeforeEach
    void setUp() {
        client = mock(TasaCambioClient.class);
        clock = new MutableClock(Instant.parse("2026-10-06T12:00:00Z"));
        service = new TasaCambioService(client, RESPALDO, Duration.ofMinutes(60), clock);
    }

    @Test
    void usaValorDeRespaldoSiLaApiNuncaResponde() {
        when(client.consultarCopPorUsd()).thenReturn(Optional.empty());
        assertEquals(RESPALDO, service.obtenerTasaCopPorUsd());
    }

    @Test
    void guardaLaTasaEnCacheMientrasEsteVigente() {
        when(client.consultarCopPorUsd()).thenReturn(Optional.of(new BigDecimal("4100")));
        service.obtenerTasaCopPorUsd();
        clock.avanzar(Duration.ofMinutes(30));
        assertEquals(new BigDecimal("4100"), service.obtenerTasaCopPorUsd());
        verify(client, times(1)).consultarCopPorUsd();
    }

    @Test
    void usaLaUltimaTasaConocidaSiLaApiFallaDespuesDeVencerLaCache() {
        when(client.consultarCopPorUsd()).thenReturn(Optional.of(new BigDecimal("4100")), Optional.empty());
        service.obtenerTasaCopPorUsd();
        clock.avanzar(Duration.ofMinutes(61));
        assertEquals(new BigDecimal("4100"), service.obtenerTasaCopPorUsd());
        verify(client, times(2)).consultarCopPorUsd();
    }

    @Test
    void noReintentaLaApiInmediatamenteDespuesDeUnFallo() {
        when(client.consultarCopPorUsd()).thenReturn(Optional.empty(), Optional.of(new BigDecimal("4100")));
        service.obtenerTasaCopPorUsd();
        assertEquals(RESPALDO, service.obtenerTasaCopPorUsd());
        verify(client, times(1)).consultarCopPorUsd();
        clock.avanzar(Duration.ofMinutes(2));
        assertEquals(new BigDecimal("4100"), service.obtenerTasaCopPorUsd());
    }

    /** Reloj de prueba que se puede adelantar. */
    private static class MutableClock extends Clock {
        private Instant ahora;

        MutableClock(Instant ahora) {
            this.ahora = ahora;
        }

        void avanzar(Duration d) {
            ahora = ahora.plus(d);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return ahora;
        }
    }
}
