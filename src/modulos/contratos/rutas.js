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
const express = require('express');
const respuesta = require('../../red/respuestas'); // Módulo para manejar respuestas
const controlador = require('./index');
const abonos = require("../abonos");
const movimientos = require("../movimientos");
const rentas = require("../rentas");
const cron = require("../cron");
const seguridadRol = require("../usuarios/seguridadRol"); // Importa el controlador de contactos


// Creación del router de Express
const router = express.Router();

// Definición de rutas.js
router.get('/', todos);
router.get('/medidas', todosMedidas);
router.get('/vista', todosVistaContratosDetalles);
router.get('/:id', uno);
router.get('/medidas/:id', unoMedidas);
router.post('/', seguridadRol(), agregar);
router.delete('/', seguridadRol(), eliminar);
router.delete('/contratoCompleto', seguridadRol(), eliminarContratoCompleto);

// Función para manejar la obtención de todos los contactos
async function todos(req, res, next) {
	try {
		const items = await controlador.todos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de todos los registros de la tabla de medidas
async function todosMedidas(req, res, next) {
	try {
		const items = await controlador.todosMedidasContratos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de todos los registros de la vista de contratos con todos los detalles
async function todosVistaContratosDetalles(req, res, next) {
	try {
		const consultaMovimientos = await movimientos.todos();
		const items = await controlador.todosVistaContratosDetalles(consultaMovimientos);

		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de un cliente específico por ID
async function uno(req, res, next) {
	try {
		const items = await controlador.uno(req.params.id);
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de un registro específico por ID de la tabla de medidas
async function unoMedidas(req, res, next) {
	try {
		const items = await controlador.unoMedidasContratos(req.params.id);
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la adición de un nuevo cliente
async function agregar(req, res, next) {
	try {
		const resultadoAgregar = await controlador.agregar(req.body);
		if (req.body.id === 0){ // Si es un contrato nuevo, "agregar" devolverá un objeto para crear el primer movimiento
			await movimientos.agregar(resultadoAgregar);
			await cron.revisarYGenerarMovimientos();
			respuesta.success(req, res, 'Nuevo Item creado con éxito', 201);
		} else {
			respuesta.success(req, res, 'Item actualizado con éxito', 201);
		}
	} catch (err) {
		next(err);
	}
};

// Función para manejar la eliminación de un cliente
async function eliminar(req, res, next) {
	try {
		const items = await controlador.eliminar(req.body);
		respuesta.success(req, res, 'Item eliminado satisfactoriamente', 200);
	} catch (err) {
		next(err);
	}
};

// Función para eliminar por completo un contrato y todos sus registros asociados de abonos, movimientos y rentas
async function eliminarContratoCompleto(req, res, next) {
	try {
		// Eliminar abonos relacionados con el contrato
		const consultaAbonos = await abonos.todosVistaAbonos();
		const abonosContrato = consultaAbonos.filter(ab =>
			ab.id_contrato === req.body.id);

		abonosContrato.forEach(clave => {
			console.log(clave);
		});

		for (const abono of abonosContrato) {
			// Creamos objeto para eliminar el abono. Se le asigna el id porque en la vista que consultamos el
			// id se llama "abono_id"
			let abonoDel = { id: '' };
			abonoDel.id = abono.abono_id;
			await abonos.eliminar(abonoDel);
		}

		// Eliminar movimientos relacionados con el contrato
		const consultaMovimientos = await movimientos.todosVistaInforme();
		const movimientosContrato = consultaMovimientos.filter(mov =>
			mov.id_contrato === req.body.id);
		for (const movimiento of movimientosContrato) {
			let movDel = { id:'' };
			movDel.id = movimiento.id;
			await movimientos.eliminarMovSinRestriccion(movDel);
		}

		// Eliminar rentas relacionadas con el contrato
		const consultaRentas = await rentas.todos();
		const rentasContrato = consultaRentas.filter(renta =>
			renta.id_contrato === req.body.id);
		console.log(rentasContrato);
		for (const renta of rentasContrato) {
			const data = {
				id_contrato: renta.id_contrato,
				fecha: renta.fecha
			}
			await rentas.eliminar(data);
		}

		// Finalmente eliminamos el contrato
		await controlador.eliminar(req.body);
		respuesta.success(req, res, 'Item eliminado satisfactoriamente', 200);
	} catch (err) {
		next(err);
	}
};

// Exporta el router para ser usado en otros archivos
module.exports = router;
