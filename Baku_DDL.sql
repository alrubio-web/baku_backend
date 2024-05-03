-- Baku - Sistema Integral de Gestión Inmobiliaria
-- Scripts de Configuración de la Base de Datos
--
-- Este archivo es parte de "Baku - Sistema Integral de Gestión Inmobiliaria".
--
-- Este código está disponible bajo la Licencia Dual:
-- - Uso no comercial bajo GNU AGPL v3.0.
-- - Uso comercial bajo Licencia Comercial (contactar al autor para más detalles).
--
-- @author Alfredo Rubio Mariño
-- @copyright (C) 2023 Alfredo Rubio Mariño
-- @license AGPL-3.0-or-later <https://www.gnu.org/licenses/agpl-3.0.html>
--
-- Este script define la estructura de la base de datos necesaria para el funcionamiento
-- de la aplicación. Incluye la creación de tablas, índices, y otros objetos de base de datos.



use `baku`;

-- -----------------------TABLAS-----------------------
-- En esta tabla hay que insertar desde el cliente de base de datos los valores de id del usuario de Google, el nombre 
-- del usuario de Google (identificar como aparece en Google) y un rol 'admin' o 'user'
CREATE TABLE `auth` (
  `id_google` VARCHAR (30) NOT NULL PRIMARY KEY,
  `name_google` VARCHAR(20) NOT NULL,
  `rol` VARCHAR(20) NOT NULL
);


CREATE TABLE contactos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_contacto VARCHAR(20),
    nombre_completo VARCHAR(80),
    apodo VARCHAR(80),
    email VARCHAR(80),
    dni VARCHAR(9),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    prefijo_pais_movil VARCHAR(10),
    movil VARCHAR(20),
    notas TEXT,
    cuenta_corriente VARCHAR(24),
    nombre_fiscal VARCHAR(200),
    telegram_token VARCHAR(100),
    telegram_chat_id VARCHAR(100),
    movil_whatsapp VARCHAR(20) GENERATED ALWAYS AS (CONCAT(prefijo_pais_movil, movil)) STORED
);


CREATE TABLE inmuebles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(80),
    tipo VARCHAR(80),
    descripcion TEXT,
    direccion VARCHAR(200),
    geolocalizacion VARCHAR(60),
    referencia_catastral VARCHAR(200),
    fecha_adquisicion DATE,
    fecha_transmision DATE,
    precio_calculo_amoritzacion DECIMAL(10, 2),
    precio_escriturado_transmision DECIMAL(10, 2),
    valor_catastral_suelo DECIMAL(10, 2),
    valor_catastral DECIMAL(10, 2), 
    notas TEXT,
    tamaño_m2 DECIMAL(10, 2),
    total_amortizaciones DECIMAL(10, 2),
    tipo_adquisicion VARCHAR(80),
    tipo_transmision VARCHAR(80),
    valor_catastral_construccion DECIMAL(10, 2) GENERATED ALWAYS AS (valor_catastral - valor_catastral_suelo) STORED,
    proporcion_valor_construccion DECIMAL(10, 2) GENERATED ALWAYS AS (valor_catastral_construccion / valor_catastral) STORED
);


CREATE TABLE inmuebles_propietarios (
    id_inmueble INT,
    id_propietario INT,
    propiedad DECIMAL(5, 2) CHECK (propiedad >= 0 AND propiedad <= 100),
    PRIMARY KEY (id_inmueble, id_propietario),
    FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_propietario) REFERENCES contactos(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE contratos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    id_inmueble INT,
    arrendador INT,
    inquilino INT,
    fecha_inicio DATE,
    fecha_fin DATE,
    deduccion_fiscal DECIMAL(10, 2),
    fianza DECIMAL(10, 2),
    estado BOOLEAN,
    tipo_pago VARCHAR(100),
    sujeto_a_IRPF BOOLEAN,
    notas VARCHAR(100),
    FOREIGN KEY (id_inmueble) REFERENCES inmuebles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (arrendador) REFERENCES contactos(id),
    FOREIGN KEY (inquilino) REFERENCES contactos(id)
);



CREATE TABLE rentas (
    fecha DATE,
    id_contrato INT,
    tipo_actualizacion VARCHAR(20),
    renta DECIMAL(10, 2),
    ipc DECIMAL(5, 2),
    tasa_variacion DECIMAL(5, 2),
    PRIMARY KEY (fecha, id_contrato),
    FOREIGN KEY (id_contrato) REFERENCES contratos(id)
);



CREATE TABLE movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    tipo VARCHAR(80),
    id_contrato INT,
    pagadero_por INT,
    propietario INT,
    descripcion TEXT,
    cantidad DECIMAL(10, 2),
    pendiente_movimiento DECIMAL(10, 2),
    pct_iva DECIMAL(5, 2),
    pct_retencion DECIMAL(5, 2),
    url_documento VARCHAR(255),
    estado VARCHAR(20),
    Fecha_inicio DATE,
    Fecha_fin DATE,
    iva DECIMAL(10, 2) GENERATED ALWAYS AS (ROUND(cantidad * pct_iva / 100, 2)) STORED,
    irpf DECIMAL(10, 2) GENERATED ALWAYS AS (ROUND(cantidad * pct_retencion / 100, 2)) STORED,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (ROUND(cantidad + (cantidad * pct_iva / 100) - (cantidad * pct_retencion / 100), 2)) STORED,
    ano_fiscal INT GENERATED ALWAYS AS (YEAR(fecha)) STORED,
    trimestre VARCHAR(10) GENERATED ALWAYS AS (CONCAT('Q', FLOOR((MONTH(fecha) - 1) / 3) + 1)) STORED,
    FOREIGN KEY (id_contrato) REFERENCES contratos(id),
    FOREIGN KEY (pagadero_por) REFERENCES contactos(id),
    FOREIGN KEY (propietario) REFERENCES contactos(id)
);


CREATE TABLE abonos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_movimiento INT,
    fecha DATE,
    abonado DECIMAL(10, 2),
    descripcion TEXT,
    FOREIGN KEY (id_movimiento) REFERENCES movimientos(id)
);


-- ------------------------------VISTAS--------------------------------

CREATE OR REPLACE VIEW medidas_contratos AS
SELECT
    c.id AS id_contrato,
    c.nombre AS nombre_contrato,
    MIN(r.fecha) AS fecha_renta_inicial,
    MAX(r.fecha) AS fecha,
    (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha ASC LIMIT 1) AS renta_inicial,
    (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1) AS renta,
    (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1, 1) AS renta_anterior,
    (SELECT r.fecha FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1, 1) AS fecha_renta_anterior,
    (SELECT r.tipo_actualizacion FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1) AS tipo_actualizacion,
    (SELECT r.ipc FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1) AS ipc,
    (SELECT r.tasa_variacion FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1) AS tasa_variacion,
    CASE 
        WHEN (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1, 1) IS NOT NULL 
        THEN ROUND(((SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1) - 
                    (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1, 1)) /
                    (SELECT r.renta FROM rentas r WHERE r.id_contrato = c.id ORDER BY r.fecha DESC LIMIT 1, 1) * 100, 2)
        ELSE 0
    END AS variacion_porcentual_renta
FROM
    contratos c
JOIN rentas r ON c.id = r.id_contrato
GROUP BY
    c.id, c.nombre;


CREATE OR REPLACE VIEW vista_contratos_detalles AS
SELECT 
    c.id AS id,
    c.nombre AS nombre,
    i.id AS id_inmueble,
    i.nombre AS nombre_inmueble,
    a.id AS arrendador,
    a.nombre_completo AS nombre_arrendador,
    inq.id AS inquilino,
    inq.nombre_completo AS nombre_inquilino,
    c.fecha_inicio,
    c.fecha_fin,
    c.deduccion_fiscal,
    c.fianza,
    c.estado,
    c.tipo_pago,
    c.sujeto_a_IRPF,
    c.notas,
    mc.renta
FROM 
    contratos c
INNER JOIN inmuebles i ON c.id_inmueble = i.id
INNER JOIN contactos a ON c.arrendador = a.id
INNER JOIN contactos inq ON c.inquilino = inq.id
LEFT JOIN medidas_contratos mc ON c.id = mc.id_contrato;


CREATE OR REPLACE VIEW vista_detalle_movimientos AS
SELECT 
    m.id AS id,
    contr.nombre AS nombre_contrato,
    contr.inquilino AS pagadero_por,
    contr.arrendador AS propietario,
    m.id_contrato AS id_contrato,
    inquilino.nombre_completo AS nombre_inquilino,
    propietario.nombre_completo AS nombre_propietario,
    m.fecha AS fecha,
    contr.fecha_inicio AS Fecha_inicio,
    contr.fecha_fin AS Fecha_fin,
    m.tipo AS tipo,
    m.descripcion AS descripcion,
    m.estado AS estado,
    m.cantidad AS cantidad,
    m.total AS total,
    m.pendiente_movimiento AS pendiente_movimiento,
    m.pct_iva AS pct_iva,
    m.pct_retencion AS pct_retencion,
    m.url_documento AS url_documento,
    m.pct_iva AS iva,
    m.irpf AS irpf,
    m.ano_fiscal AS ano_fiscal,
    m.trimestre AS trimestre,
    inquilino.movil_whatsapp AS contacto_movil_whatsapp,
    inm.nombre AS nombre_inmueble,
    CONCAT(m.id, '-', inquilino.nombre_completo, '-', contr.nombre, '-', m.fecha) AS id_desc_fecha
FROM 
    movimientos m
INNER JOIN contratos contr ON m.id_contrato = contr.id
INNER JOIN inmuebles inm ON contr.id_inmueble = inm.id
INNER JOIN contactos inquilino ON contr.inquilino = inquilino.id
INNER JOIN contactos propietario ON contr.arrendador = propietario.id;


CREATE OR REPLACE VIEW vista_inmuebles_propietarios_detalle AS
SELECT 
    ip.id_inmueble,
    ip.id_propietario,
    ip.propiedad,
    c.nombre_completo AS nombre_propietario,
    i.nombre AS nombre_inmueble
FROM 
    inmuebles_propietarios ip
INNER JOIN contactos c ON ip.id_propietario = c.id
INNER JOIN inmuebles i ON ip.id_inmueble = i.id;


CREATE OR REPLACE VIEW detalles_abonos_movimientos AS
SELECT 
    a.id AS abono_id,
    a.id_movimiento AS id_movimiento,
    a.fecha AS abono_fecha,
    a.abonado AS abonado,
    a.descripcion AS abono_descripcion,
    vdm.id_contrato AS id_contrato,
    vdm.nombre_contrato,
    vdm.nombre_inquilino,
    vdm.nombre_propietario,
    vdm.fecha AS movimiento_fecha,
    vdm.descripcion AS movimiento_descripcion,
    vdm.total AS movimiento_total,
    CONCAT(vdm.id, '-', vdm.nombre_inquilino, '-', vdm.nombre_contrato, '-', vdm.fecha) AS id_desc_fecha
FROM 
    abonos a
INNER JOIN vista_detalle_movimientos vdm ON a.id_movimiento = vdm.id



CREATE OR REPLACE VIEW vista_informacion_inmuebles AS
SELECT 
    i.id AS id_inmueble,
    i.nombre AS nombre_inmueble,
    i.tipo AS tipo_inmueble,
    i.descripcion AS descripcion_inmueble,
    i.geolocalizacion AS geolocalizacion_inmueble,
    COALESCE(MAX(c.estado AND c.fecha_fin >= CURRENT_DATE), 0) AS esta_alquilado,
    CASE 
        WHEN MAX(c.estado AND c.fecha_fin >= CURRENT_DATE) THEN 'alquilado'
        ELSE 'disponible'
    END AS estado_inmueble,
    MAX(c.id) AS id_contrato,
    MAX(contactos_arrendador.nombre_completo) AS nombre_propietario,
    MAX(contactos_arrendador.id) AS id_propietario,
    MAX(contactos_inquilino.nombre_completo) AS nombre_inquilino,
    MAX(contactos_inquilino.id) AS id_inquilino,
    MAX(c.fecha_inicio) AS fecha_inicio_contrato,
    MAX(c.fecha_fin) AS fecha_fin_contrato
FROM 
    inmuebles i
LEFT JOIN contratos c ON i.id = c.id_inmueble AND c.estado = 1
LEFT JOIN contactos contactos_arrendador ON c.arrendador = contactos_arrendador.id
LEFT JOIN contactos contactos_inquilino ON c.inquilino = contactos_inquilino.id
GROUP BY 
    i.id;

-- ------------------------------ÍNDICES--------------------------------
CREATE INDEX idx_email ON contactos(email);

CREATE INDEX idx_nombre_completo_apodo ON contactos(nombre_completo, apodo);

CREATE INDEX idx_nombre_inmuebles ON inmuebles(nombre);

CREATE INDEX idx_tipo_inmuebles ON inmuebles(tipo);

CREATE INDEX idx_id_propietario ON inmuebles_propietarios(id_propietario);

CREATE INDEX idx_id_inmueble ON contratos(id_inmueble);

CREATE INDEX idx_arrendador_inquilino ON contratos(arrendador, inquilino);

CREATE INDEX idx_id_contrato_fecha ON rentas(id_contrato, fecha);

CREATE INDEX idx_id_contrato_movimientos ON movimientos(id_contrato);

CREATE INDEX idx_fecha_tipo_movimientos ON movimientos(fecha, tipo);

CREATE INDEX idx_id_movimiento_abonos ON abonos(id_movimiento);

