/**
 * Baku - Sistema Integral de Gestión Inmobiliaria
 *
 * Este archivo es parte de "Baku - Sistema Integral de Gestión Inmobiliaria".
 *
 * Este código está disponible bajo la Licencia Dual:
 * - Uso no comercial bajo GNU AGPL v3.0.
 * - Uso comercial bajo Licencia Comercial (contactar al autor para más detalles).
 *
 * @author Alfredo Rubio Mariño
 * @copyright (C) 2023 Alfredo Rubio Mariño
 * @license AGPL-3.0-or-later <https://www.gnu.org/licenses/agpl-3.0.html>
 */

	// Importación de módulos necesarios
const express = require('express');
const respuesta = require('../../red/respuestas'); // Módulo para manejar respuestas
const controlador = require('./index'); // Importa el controlador de contactos
const seguridadRol = require ('../usuarios/seguridadRol'); // Importa el middleware para comprobar rol de usuario

// Creación del router de Express
const router = express.Router();

// Definición de rutas.js
router.get('/', seguridadRol(), revisarYGenerarMovimientos);

// Función para llamar a la revisión de movimientos periódicos y generar automáticamente si procede
async function revisarYGenerarMovimientos(req, res, next) {
	try {
		let mensaje = await controlador.revisarYGenerarMovimientos();
		respuesta.success(req, res, mensaje, 200);
	} catch (err) {
		next(err);
	}
};


// Exporta el router para ser usado en otros archivos
module.exports = router;
