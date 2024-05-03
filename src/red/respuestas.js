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

// Función para manejar respuestas exitosas
exports.success = function (req, res, mensaje = '', status = 200) {
	res.status(status).send({
		error: false, // Indica que no hay error
		status: status, // Estado HTTP
		body: mensaje // Cuerpo del mensaje
	});
}

// Función para manejar respuestas de error
exports.error = function (req, res, mensaje = 'Error Interno', status = 500) {
	res.status(status).send({
		error: true, // Indica que hay un error
		status: status, // Estado HTTP
		body: mensaje // Cuerpo del mensaje
	});
}
