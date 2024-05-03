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
const auth = require('./index');

module.exports = function() {
	return function(req, res, next) {
		// Lista de rutas que no requieren autenticación
		const rutasSinAutenticacion = [
			'/api/authGoogle/google',
			'/api/authGoogle/session',
		];

		// Verifica si la ruta actual está en la lista de rutas sin autenticación
		if (rutasSinAutenticacion.some(ruta => req.path.startsWith(ruta))) {
			return next(); // Permite la solicitud sin verificar el token
		}

		// Lógica para verificar el token
		try {
			//*/
			// Extraer y verificar el token a partir de las cookies
			const token = req.cookies.internalToken;
			if (!token) {
				throw new Error('No token provided'); // Lanza un error si no se encuentra el token
			}
			auth.verificarToken(token);
			//*/
			next();
		} catch (error) {
			console.log('Error en la capa de seguridad');
			throw error;
		}
	};
};
