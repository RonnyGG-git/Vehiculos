# API REST de Concesionario de Vehículos

API REST construida con **Spring Boot** para administrar un concesionario: clientes, marcas,
vehículos, ventas y mantenimientos. Incluye validaciones, reglas de negocio, manejo
centralizado de errores y consumo de una API externa de tasa de cambio para mostrar el
precio de cada vehículo en pesos colombianos (COP) y en dólares (USD).

## Tabla de contenido

- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo ejecutar (sin permisos de administrador)](#cómo-ejecutar-sin-permisos-de-administrador)
- [Configuración](#configuración)
- [Endpoints – Clientes, Marcas y Vehículos (Persona A)](#endpoints--clientes-marcas-y-vehículos-persona-a)
- [Endpoints – Ventas y Mantenimientos (Persona B)](#endpoints--ventas-y-mantenimientos-persona-b)
- [Reglas de negocio](#reglas-de-negocio)
- [Formato de errores](#formato-de-errores)
- [Pruebas con Postman](#pruebas-con-postman)
- [Documentación](#documentación)
- [División del trabajo](#división-del-trabajo)

## Tecnologías

| Tecnología | Uso |
|---|---|
| Java 17 | Lenguaje |
| Spring Boot 4.1 | Web MVC, Data JPA, Validation, RestClient |
| Hibernate / JPA | Persistencia |
| H2 (modo archivo) | Base de datos por defecto, no requiere instalación |
| MySQL | Base de datos opcional (perfil `mysql`) |
| Lombok | Getters y setters de las entidades |
| Maven Wrapper (`mvnw`) | Compilación sin instalar Maven |
| JUnit 5 + Mockito | Pruebas unitarias |
| Postman | Pruebas de los endpoints |
| [open.er-api.com](https://open.er-api.com) | API externa de tasa de cambio USD → COP (gratuita, sin API key) |

## Estructura del proyecto

```
src/main/java/com/vehiculo/vehiculos
├── client/       Clientes de servicios externos (TasaCambioClient)
├── controller/   Controladores REST
├── dto/          Objetos de entrada/salida con validaciones (records)
├── entity/       Entidades JPA: Cliente, Marca, Vehiculo, Venta, Mantenimiento, EstadoVehiculo
├── exception/    Excepciones y GlobalExceptionHandler
├── repository/   Repositorios Spring Data JPA
└── service/      Lógica de negocio
docs/             Modelo de datos y documentación (draw.io)
postman/          Colecciones de Postman
```

El modelo de datos (DER y modelo relacional) está en [`docs/modelo-datos.md`](docs/modelo-datos.md).

## Cómo ejecutar (sin permisos de administrador)

Todo se instala dentro de la carpeta del usuario (`C:\Users\TU_USUARIO`), donde Windows no pide
permisos de administrador.

### 1. JDK 17 portable

1. En [adoptium.net](https://adoptium.net) descarga **Temurin JDK 17, Windows x64, en formato `.zip`**
   (no el `.msi`, que pide administrador).
2. Descomprímelo en `C:\Users\TU_USUARIO\tools\jdk-17`.
3. Pulsa `Win + R`, escribe `rundll32 sysdm.cpl,EditEnvironmentVariables` y pulsa Enter. Se abren las
   variables **de tu cuenta** (no las del sistema), que no requieren administrador:
   - Nueva variable `JAVA_HOME` = `C:\Users\TU_USUARIO\tools\jdk-17`
   - Edita `Path` de tu usuario y agrega `%JAVA_HOME%\bin`
4. Abre una terminal nueva y comprueba con `java -version`.

> Alternativa sin tocar variables: en cada terminal ejecuta
> `set JAVA_HOME=C:\Users\TU_USUARIO\tools\jdk-17` antes de usar `mvnw`.

### 2. Compilar y ejecutar con Maven Wrapper

No hace falta instalar Maven: `mvnw` lo descarga solo en `C:\Users\TU_USUARIO\.m2`.

```bash
# Windows (cmd)
mvnw.cmd clean package
mvnw.cmd spring-boot:run

# Linux / macOS / Git Bash
./mvnw clean package
./mvnw spring-boot:run
```

También se puede ejecutar el JAR generado: `java -jar target/vehiculos-0.0.1-SNAPSHOT.jar`.

La API queda en `http://localhost:8080`.

Problemas frecuentes:

- **PowerShell bloquea scripts:** usa `cmd` o ejecuta `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
  (solo afecta a tu usuario).
- **Red con proxy:** crea `C:\Users\TU_USUARIO\.m2\settings.xml` con los datos del proxy.
- **Aviso del firewall:** puedes pulsar *Cancelar*; `localhost` sigue funcionando.

### 3. Base de datos H2

No se instala nada: la base se crea sola en la carpeta `./data` (ignorada por git).

- Consola web: <http://localhost:8080/h2-console>
- JDBC URL: `jdbc:h2:file:./data/concesionario`
- Usuario: `sa`, sin contraseña

Para borrar todos los datos, detén la aplicación y elimina la carpeta `data/`.

### 4. (Opcional) MySQL

```bash
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=mysql
```

Usa `src/main/resources/application-mysql.properties` (base `concesionario` en `localhost:3306`; usuario y
clave en las variables `DB_USER` y `DB_PASSWORD`).

## Configuración

`src/main/resources/application.properties`:

| Propiedad | Valor por defecto | Descripción |
|---|---|---|
| `tasa-cambio.url` | `https://open.er-api.com/v6/latest/USD` | API externa de tasa de cambio |
| `tasa-cambio.respaldo` | `4000` | COP por 1 USD si la API no responde |
| `tasa-cambio.minutos-cache` | `60` | Minutos que se guarda la tasa en memoria |
| `tasa-cambio.timeout-segundos` | `5` | Tiempo máximo de espera de la API |

## Endpoints – Clientes, Marcas y Vehículos (Persona A)

### Clientes `/clientes`

| Método | Ruta | Respuestas |
|---|---|---|
| GET | `/clientes` | 200 lista |
| GET | `/clientes/{id}` | 200 / 404 |
| POST | `/clientes` | 201 / 400 validación / 409 email o documento repetido |
| PUT | `/clientes/{id}` | 200 / 400 / 404 / 409 |
| DELETE | `/clientes/{id}` | 204 / 404 / 409 si tiene ventas |

```json
{
  "nombre": "Carlos Pérez",
  "documento": "1047456789",
  "email": "carlos@correo.com",
  "telefono": "3001234567"
}
```

### Marcas `/marcas`

| Método | Ruta | Respuestas |
|---|---|---|
| GET | `/marcas` | 200 lista |
| GET | `/marcas/{id}` | 200 / 404 |
| POST | `/marcas` | 201 / 400 / 409 nombre repetido |

```json
{ "nombre": "Toyota", "paisOrigen": "Japón" }
```

### Vehículos `/vehiculos`

| Método | Ruta | Respuestas |
|---|---|---|
| GET | `/vehiculos` | 200 lista |
| GET | `/vehiculos/{id}` | 200 / 404 |
| GET | `/vehiculos/disponibles` | 200, solo los vehículos en estado `DISPONIBLE` |
| GET | `/vehiculos/marca/{marca}` | 200, busca por **nombre** de la marca sin distinguir mayúsculas |
| POST | `/vehiculos` | 201 / 400 (precio negativo, placa inválida) / 404 marca inexistente / 409 placa repetida |
| PUT | `/vehiculos/{id}` | 200 / 400 / 404 / 409 |
| DELETE | `/vehiculos/{id}` | 204 / 404 / 409 si ya fue vendido |
| POST | `/vehiculos/{id}/salir-taller` | 200, `EN_MANTENIMIENTO` → `DISPONIBLE` / 404 / 409 si no está en mantenimiento |

Petición (el estado no se envía: todo vehículo nuevo queda `DISPONIBLE`):

```json
{
  "placa": "ABC123",
  "marcaId": 1,
  "modelo": "Corolla",
  "anio": 2024,
  "color": "Blanco",
  "precio": 95000000
}
```

Respuesta, con el precio en COP y USD:

```json
{
  "id": 1,
  "placa": "ABC123",
  "marcaId": 1,
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2024,
  "color": "Blanco",
  "precioCop": 95000000,
  "precioUsd": 24281.46,
  "tasaCambioCopPorUsd": 3912.45,
  "estado": "DISPONIBLE"
}
```

### Integración con Ventas y Mantenimientos

- `VehiculoService.cambiarEstado(id, EstadoVehiculo)`: cambia el estado del vehículo
  (`VENDIDO`, `EN_MANTENIMIENTO`, `DISPONIBLE`).
- `VehiculoService.obtenerEntidad(id)` y `ClienteService.obtenerEntidad(id)`: devuelven la entidad
  o lanzan `RecursoNoEncontradoException` (404).

## Endpoints – Ventas y Mantenimientos (Persona B)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/ventas` | Registrar una venta |
| GET | `/ventas` | Listar ventas |
| POST | `/mantenimientos` | Registrar un mantenimiento |
| GET | `/mantenimientos` | Listar mantenimientos |
| GET | `/mantenimientos/vehiculo/{vehiculoId}` | Historial de mantenimientos de un vehículo |

<!-- Persona B: completa o ajusta esta sección con el detalle de tus endpoints. -->

## Reglas de negocio

| Módulo | Regla | Respuesta |
|---|---|---|
| Clientes | El email es único, sin distinguir mayúsculas (se guarda en minúsculas) | 409 |
| Clientes | El documento es único | 409 |
| Clientes | No se elimina un cliente que tiene ventas | 409 |
| Marcas | El nombre es único, sin distinguir mayúsculas | 409 |
| Vehículos | La placa es única (se guarda en mayúsculas y sin guion: `abc-123` → `ABC123`) | 409 |
| Vehículos | Formato de placa `ABC123` (carro) o `ABC12D` (moto) | 400 |
| Vehículos | El precio es obligatorio y no puede ser negativo | 400 |
| Vehículos | Un vehículo nuevo siempre queda `DISPONIBLE` | — |
| Vehículos | No se elimina un vehículo vendido | 409 |
| Tasa de cambio | La tasa se guarda en caché `tasa-cambio.minutos-cache` minutos. Si la API falla se usa la última tasa conocida o el valor de respaldo, y no se vuelve a consultar durante 1 minuto | — |
| Ventas | No se vende un vehículo vendido o en mantenimiento; fecha y total automáticos; descuento del 5 % si el precio supera $100.000.000; el vehículo pasa a `VENDIDO` | 409 |
| Mantenimientos | El vehículo pasa a `EN_MANTENIMIENTO`; no aplica a vehículos vendidos | 409 |

## Formato de errores

Todas las respuestas de error usan `ErrorResponse`, generado por `GlobalExceptionHandler`:

```json
{
  "timestamp": "2026-10-05T23:15:00.123",
  "status": 400,
  "error": "Bad Request",
  "message": "Error de validación",
  "path": "/vehiculos",
  "details": ["precio: el precio no puede ser negativo"]
}
```

| Excepción | HTTP |
|---|---|
| `RecursoNoEncontradoException` | 404 |
| `BusinessException` (y sus subclases, p. ej. `VehiculoNoDisponibleException`) | 409 |
| Validación / JSON inválido / tipo de parámetro inválido | 400 |
| `DataIntegrityViolationException` | 409 |
| Cualquier otra | 500 |

## Pruebas con Postman

1. Instala Postman (se instala en tu usuario, sin administrador) o usa la extensión *Thunder Client* de VS Code.
2. Importa `postman/Concesionario_PersonaA.postman_collection.json`.
3. Con la aplicación corriendo, usa **Run collection**: 29 peticiones con pruebas automáticas
   (Marcas → Clientes → Vehículos). La colección genera placas, documentos y emails aleatorios,
   así que se puede ejecutar varias veces seguidas.

**Colección final de entrega:** `postman/Concesionario_Final.postman_collection.json` — 44 peticiones de
todos los módulos (marcas, clientes, vehículos, ventas, mantenimientos) con pruebas automáticas. Crea sus
propios datos, así que no necesita `db/02-datos-prueba.sql` y se puede ejecutar varias veces seguidas.

Pruebas unitarias: `mvnw.cmd test`.

## Documentación

**Entregables consolidados:** [`docs/entregables/DOCUMENTACION.md`](docs/entregables/DOCUMENTACION.md) —
requerimientos funcionales y no funcionales, historias de usuario, casos de uso, diagramas de clases y de
secuencia, DER, modelo relacional, endpoints y lista de verificación de requisitos. Los diagramas están en
`docs/entregables/*.drawio` (con imágenes en `docs/entregables/png/`) y el DDL en `db/00-esquema.sql`.

| Archivo | Contenido |
|---|---|
| [`docs/entregables/DOCUMENTACION.md`](docs/entregables/DOCUMENTACION.md) | Documento de entregables completo |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | DER, modelo relacional y formato de error |
| `docs/Documentacion_PersonaA_Concesionario.drawio` | Casos de uso, especificación, requerimientos funcionales y no funcionales (se abre en [app.diagrams.net](https://app.diagrams.net)) |

## División del trabajo

| | Persona A | Persona B |
|---|---|---|
| Módulos | Clientes + Vehículos (y Marcas) | Ventas + Mantenimientos |
| Endpoints | CRUD de clientes y vehículos, `/vehiculos/disponibles`, `/vehiculos/marca/{marca}`, `/marcas` | `POST/GET /ventas`, `POST/GET /mantenimientos`, historial por vehículo |
| Reglas de negocio | Placa única, correo único, precio no negativo | No vender un vehículo vendido o en mantenimiento, fecha y total automáticos, descuento del 5 % sobre $100M, cambio automático de estado |
| Extra técnico | API externa de tasa de cambio y conversión COP → USD | Excepciones personalizadas |
| Postman | Pruebas de sus endpoints | Pruebas de sus endpoints y colección final |
| Documentación | Casos de uso, requerimientos funcionales y no funcionales | Diagrama de clases, diagrama de secuencia de la venta, historias de usuario |

Ramas: `feature/clientes-vehiculos` (Persona A) y `feature/ventas-mantenimientos` (Persona B), con merge a `master`.
