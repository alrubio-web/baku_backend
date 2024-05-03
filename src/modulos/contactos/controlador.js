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

const contratos = require("../contratos");
const movimientos = require("../movimientos");
const abonos = require("../abonos");
const TABLA = 'contactos'; // Nombre de la tabla en la base de datos

module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los contactos con detalle del saldo por contacto
	async function todosInquilinos() {
		let contactos = await db.todos(TABLA);
		const consultaContratos = await contratos.todos();
		const inquilinos = consultaContratos.map(contrato => contrato.inquilino);

		// Filtrando solo los contactos que son inquilinos
		let contactosInquilinos = contactos.filter(contacto => inquilinos.includes(contacto.id));

		for (let contacto of contactosInquilinos) {
			// Obteniendo el saldo para cada contacto
			let saldoContacto = await saldo(contacto.id);
			// Añadiendo el saldo como un nuevo par clave-valor
			contacto.saldo = saldoContacto;
		}
		// Devolviendo los contactos inquilinos con su saldo correspondiente
		return contactosInquilinos;
	}

	// Función para obtener todos los contactos
	function todos() {
		return db.todos(TABLA);
	}

	// Función para obtener un contacto específico por ID
	function uno(id) {
		return db.uno(TABLA, id);
	}


	// Función para agregar un nuevo contacto
	async function agregar(body) {
		return db.agregar(TABLA, body);
	}


	// Función para eliminar un contacto
	function eliminar(body) {
		return db.eliminar(TABLA, body);
	}


	async function saldo(idInquilino) {
		try {
			const consultaMovimientos = await movimientos.todos();

			const movimientosInquilino = consultaMovimientos.filter(m => m.pagadero_por === Number(idInquilino));

			const cantidadMovimientosInquilino = movimientosInquilino.reduce((suma, actual) =>
				actual.estado !== "anulado" ? suma + actual.total : suma, 0);


			const idsMovimientosInquilino = movimientosInquilino.map(mov => mov.id); // pasamos cada movimiento del array a
			// ser un elemento únicamente con el id.
			const consultaAbonos = await abonos.todos();
			const abonosMovimientosInquilino = consultaAbonos.filter(a => idsMovimientosInquilino.includes(a.id_movimiento)); // Compara los ids con el array de ids anterior

			const sumaAbonosInquilino = abonosMovimientosInquilino.reduce((suma, actual) => suma + actual.abonado, 0);

			const saldo = sumaAbonosInquilino - cantidadMovimientosInquilino;
			return parseFloat(saldo.toFixed(2));

		} catch (error) {
			throw error;
		}
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, uno, agregar, eliminar, saldo, todosInquilinos
	}
}
