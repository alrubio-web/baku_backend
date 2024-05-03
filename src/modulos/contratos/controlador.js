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

const rentas = require("../rentas");
const TABLA = 'contratos'; // Nombre de la tabla en la base de datos
const TABLA_MEDIDAS = 'medidas_contratos';
const TABLA_DETALLES = 'vista_contratos_detalles';
const abonos = require("../abonos");
const moment = require("moment/moment");


module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los contratos
	function todos() {
		return db.todos(TABLA);
	}

	// Función para obtener todos los registros de medidas_contratos
	async function todosVistaContratosDetalles(movimientos) {
		let contratos= await db.todos(TABLA_DETALLES);

		for (let contrato of contratos) {
			// Obteniendo el saldo para cada contrato
			let saldoContrato = await saldoPorContrato(contrato.id, movimientos);
			// Añadiendo el saldo como un nuevo par clave-valor
			contrato.saldo = saldoContrato;
		}
		// Devolviendo los contratos con su saldo correspondiente
		return contratos;
	}

	// Función para obtener todos los registros de vista_contratos_detalles
	function todosMedidasContratos() {
		return db.todos(TABLA_MEDIDAS);
	}

	// Función para obtener un cliente específico por ID
	function uno(id) {
		return db.uno(TABLA, id);
	}

	// Función para obtener un registro de medidas_contratos
	function unoMedidasContratos(id) {
		return db.uno(TABLA_MEDIDAS, id);
	}

	// Función para agregar un nuevo contrato
	async function agregar(body) {
		try {
			// Listas de claves para cada tabla
			const clavesContrato = ['id', 'nombre', 'id_inmueble', 'arrendador', 'inquilino', 'fecha_inicio', 'fecha_fin', 'deduccion_fiscal', 'fianza', 'estado', 'tipo_pago', 'sujeto_a_IRPF', 'notas'];
			const clavesRentas = ['fecha', 'id_contrato', 'tipo_actualizacion', 'renta', 'ipc', 'tasa_variacion'];

			// Construir objeto contrato
			let contrato = {};
			clavesContrato.forEach(clave => {
				if (body.hasOwnProperty(clave)) {
					contrato[clave] = body[clave];
				}
			});

			// Comprobamos que no exista un contrato con el mismo id_inmueble y fechas solapadas para un contrato nuevo o la actualización de uno existente
			const consultaContratos = await db.todos(TABLA);
			const contratosSolapados = consultaContratos.filter(c =>
				c.id_inmueble === contrato.id_inmueble &&
				c.estado &&
				!(moment(c.fecha_fin).isBefore(moment(contrato.fecha_inicio)) || moment(c.fecha_inicio).isAfter(moment(contrato.fecha_fin)))
			);

			if (contratosSolapados.length > 0) {
				throw new Error('Existe(n) contrato(s) activo(s) que se solapan en las fechas proporcionadas para el mismo' +
					' inmueble.');
			}

			// Realizar inserción en la tabla contratos
			const respuesta = await db.agregar(TABLA, contrato);
			let insertId = body.id === 0 ? respuesta.insertId : body.id;

			if(body.id===0){
				// Construir objeto rentas
				let renta = {};
				clavesRentas.forEach(clave => {
					if (body.hasOwnProperty(clave)) {
						renta[clave] = body[clave];
					}
				});

				// Clonamos el objeto renta para añadirle los valores que no venían en el body
				let rentaActualizada = {...renta};
				rentaActualizada.fecha = body.fecha_inicio;
				rentaActualizada.id_contrato = insertId;

				// Realizamos inserción en la tabla rentas
				const respuesta = await rentas.agregar(rentaActualizada);

				// Construimos el objeto del primer movimiento asociado al contrato a partir de la información del body y
				// de las variables usadas anteriormente. Lo retorna esta función y se utilizará desde rutas.js para
				// evitar referencias circulares entre movimientos y contratos
				let primerMovimiento = {
					id: 0,
					fecha: body.fecha_inicio,
					tipo: "periódico",
					id_contrato: insertId,
					descripcion: "Alquiler Mensual",
					pct_iva: 21, //TODO lógica actualización de iva e irpf
					pct_retencion: 19,
					Fecha_inicio: body.fecha_inicio,
					Fecha_fin: body.fecha_fin,
					estado: 'pendiente'
				}
				return primerMovimiento;
			}
			return respuesta;

		} catch (error) {
			// Manejar cualquier otro error que pueda ocurrir
			throw error;
		}

	}

	async function saldoPorContrato(idContrato, movimientos) {
		try {
			const movimientosContrato = movimientos.filter(m => m.id_contrato === Number(idContrato));

			const cantidadMovimientosContrato = movimientosContrato.reduce((suma, actual) =>
				actual.estado !== "anulado" ? suma + actual.total : suma, 0);


			const idsMovimientosContrato = movimientosContrato.map(mov => mov.id); // pasamos cada movimiento del array a
			// ser un elemento únicamente con el id.
			const consultaAbonos = await abonos.todos();
			const abonosMovimientosContrato = consultaAbonos.filter(a => idsMovimientosContrato.includes(a.id_movimiento)); // Compara los ids con el array de ids anterior

			const sumaAbonosContrato = abonosMovimientosContrato.reduce((suma, actual) => suma + actual.abonado, 0);

			const saldo = sumaAbonosContrato - cantidadMovimientosContrato;
			return parseFloat(saldo.toFixed(2));

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
		todos, uno, agregar, eliminar, todosMedidasContratos, unoMedidasContratos, todosVistaContratosDetalles, saldoPorContrato
	}
}
