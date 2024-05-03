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

// Importación del módulo de comprobación de rol de usuario
const service = require('./index');

// Exportación de la función que chequea el rol
module.exports = function rol() {
	// Definición del middleware
	async function middleware(req, res, next) {
		const tieneRolAdmin = await service.chequearRol();
		if (!tieneRolAdmin) {
			// Si el usuario no es administrador, responde con un código de estado HTTP 403 Forbidden
			return res.status(403).json({ message: "No tienes privilegios para realizar esta acción." });
		}
		next(); // Pasa al siguiente middleware o ruta si es administrador
	}
	// Retorna el middleware
	return middleware;
}