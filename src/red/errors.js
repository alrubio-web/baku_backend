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

// Importación del módulo de respuestas
const respuesta = require('./respuestas');

// Definición del middleware de manejo de errores
function errors(err, req, res, next) {
	console.error('[error]', err); // Logueo del error en la consola

	const message = err.message || 'Error interno'; // Mensaje de error
	const status = err.statusCode || 500; // Código de estado HTTP

	// Envío de la respuesta de error al cliente
	respuesta.error(req, res, message, status);
}

// Exportación del middleware de manejo de errores
module.exports = errors;
