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

const TABLA = 'inmuebles_propietarios'; // Nombre de la tabla en la base de datos
const TABLA_DETALLE = 'vista_inmuebles_propietarios_detalle'

module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	function todos() {
		return db.todos(TABLA);
	}

	function todos_detalle_vista() {
		return db.todos(TABLA_DETALLE);
	}


	async function agregar(body) {
		try {
			// Verificar si la suma de las propiedades excede el 100%
			const propiedades = await db.todos(TABLA);
			const sumaRestoPropiedad = propiedades
				.filter(p => p.id_inmueble === parseInt(body.id_inmueble) && parseInt(p.id_propietario) !== parseInt(body.id_propietario))
				.reduce((suma, actual) => suma + actual.propiedad, 0);

			if (sumaRestoPropiedad + body.propiedad <= 100) {
				// Insertar o actualizar el registro primero

				const resultado = await db.agregar(TABLA, body);
				return resultado;
			} else {
				throw new Error('La suma de la propiedad para este inmueble excede el 100%');
			}
		} catch (error) {
			// Manejar cualquier otro error que pueda ocurrir
			throw error;
		}
	}

	function eliminar(body) {
		return db.eliminar(TABLA, body);
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, agregar, eliminar, todos_detalle_vista
	}
}
