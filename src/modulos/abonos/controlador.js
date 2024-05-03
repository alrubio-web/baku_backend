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

const TABLA = 'abonos'; // Nombre de la tabla en la base de datos
const VISTA = 'detalles_abonos_movimientos';

module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los abonos
	function todos() {
		return db.todos(TABLA);
	}

	// Función para obtener todos los abonos con detalle de movimientos, contratos y contactos asociados
	function todosVistaAbonos() {
		return db.todos(VISTA);
	}

	// Función para obtener un abono específico por ID
	function uno(id) {
		return db.uno(TABLA, id);
	}

	// Función para agregar un nuevo abono
	async function agregar(body) {
		return db.agregar(TABLA, body);
	}

	//Función para actualizar un movimiento al agregar un abono
	async function actualiza_movimiento(abonado, mov) {
		try {
			let movimiento = Array.isArray(mov) ? mov[0] : mov;

			// Calculamos el nuevo campo "pendiente_movimiento"
			let pendiente_movimiento_actualizado;
			if (abonado >= movimiento.pendiente_movimiento) {
				pendiente_movimiento_actualizado = 0;
				console.log("abonado >= movimiento.pendiente_movimiento");
			} else if (abonado <0 && -abonado >= movimiento.total) {
				console.log("abonado <0 && -abonado >= movimiento.total");
				pendiente_movimiento_actualizado = movimiento.total;
			} else if (abonado < 0 && -abonado < movimiento.total) {
				console.log("abonado < 0 && -abonado < movimiento.total");
				pendiente_movimiento_actualizado = movimiento.total + abonado;
			} else if (abonado >= 0 && abonado < movimiento.pendiente_movimiento) {
				console.log("abonado >= 0 && abonado < movimiento.pendiente_movimiento");
				pendiente_movimiento_actualizado = movimiento.pendiente_movimiento - abonado;
			}

			// Realizamos un clonado del objeto movimiento para evitar mutaciones
			let movimientoActualizado = {...movimiento};

			// Actualizamos el campo pendiente movimiento del movimiento:
			movimientoActualizado.pendiente_movimiento = pendiente_movimiento_actualizado;

			// Si pendiente_movimiento igual a cero, cambiamos el estado a "abonado"
			if (movimientoActualizado.pendiente_movimiento === 0) {
				movimientoActualizado.estado = "abonado";
			} else {
				movimientoActualizado.estado = "pendiente";
			}

			return movimientoActualizado;

		} catch (error) {
			throw error;
		}
	}


	// Función para eliminar un cliente
	function eliminar(body) {
		return db.eliminar(TABLA, body);
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, uno, agregar, eliminar, actualiza_movimiento, todosVistaAbonos
	}
}
