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

// Función para crear y manejar errores personalizados
function error (message, code) {
	let e = new Error(message); // Crea un nuevo objeto Error con el mensaje proporcionado

	if(code) {
		e.statusCode = code; // Si se proporciona un código, se asigna al objeto Error
	}

	return e; // Retorna el objeto Error
}

// Exporta la función para ser usada en otros archivos
module.exports = error;
