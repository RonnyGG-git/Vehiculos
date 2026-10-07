package com.vehiculo.vehiculos.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * Cliente HTTP de la API externa de tasa de cambio (open.er-api.com).
 * Solo consulta la API; la caché y el valor de respaldo están en {@code TasaCambioService}.
 */
@Component
public class TasaCambioClient {

    private static final Logger log = LoggerFactory.getLogger(TasaCambioClient.class);

    private final RestClient restClient;
    private final String url;

    public TasaCambioClient(RestClient.Builder builder,
                            @Value("${tasa-cambio.url}") String url,
                            @Value("${tasa-cambio.timeout-segundos:5}") long timeoutSegundos) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(timeoutSegundos));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSegundos));
        this.restClient = builder.requestFactory(factory).build();
        this.url = url;
    }

    /** @return pesos colombianos por 1 dólar, o vacío si la API falla o no trae el valor COP. */
    public Optional<BigDecimal> consultarCopPorUsd() {
        try {
            RespuestaApi respuesta = restClient.get().uri(url).retrieve().body(RespuestaApi.class);
            if (respuesta != null && respuesta.rates() != null) {
                BigDecimal tasa = respuesta.rates().get("COP");
                if (tasa != null && tasa.signum() > 0) {
                    return Optional.of(tasa);
                }
            }
            log.warn("La API de tasa de cambio respondió sin el valor COP");
        } catch (RuntimeException ex) {
            log.warn("No se pudo consultar la API de tasa de cambio: {}", ex.getMessage());
        }
        return Optional.empty();
    }

    /** Parte de la respuesta de la API que nos interesa. */
    record RespuestaApi(String result, Map<String, BigDecimal> rates) {
    }
}
