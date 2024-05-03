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

const utilidades = require("../utilidades");
const TABLA = 'rentas'; // Nombre de la tabla en la base de datos

module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los contactos
	function todos() {
		return db.todos(TABLA);
	}


	// Función para agregar un nuevo cliente
	function agregar(body) {
		const clavesRentas = ['fecha', 'id_contrato', 'tipo_actualizacion', 'renta', 'ipc', 'tasa_variacion'];

		// Construir objeto rentas
		let renta = {};
		clavesRentas.forEach(clave => {
			if (body.hasOwnProperty(clave)) {
				renta[clave] = body[clave];
			}
		});

		// Verificar si el campo fecha ya tiene un valor asignado
		if (!renta.fecha) {
			// El campo fecha se añade desde aquí y corresponde a la fecha actual en el momento de
			// crear o actualizar una renta si no se proporcionó antes de llamar a la función
			const fechaRenta = utilidades.FechaActualAlmacenamiento();
			renta.fecha = fechaRenta; // Asignar la fecha actual solo si el campo fecha viene vacío
		}
		// Si la fecha ya estaba presente en el body, renta no se modifica.
		return db.agregar(TABLA, renta);
	}


	// Función para eliminar un cliente
	function eliminar(body) {
		return db.eliminar(TABLA, body);
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, agregar, eliminar
	}
}
