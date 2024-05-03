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
const seguridadRol = require("../usuarios/seguridadRol");
const movimientos = require("../movimientos");

// Creación del router de Express
const router = express.Router();

// Definición de rutas.js
router.get('/', todos);
router.get('/vista', todosVistaAbonos);
router.get('/:id', uno);
router.post('/', seguridadRol(), agregar);
router.delete('/', seguridadRol(), eliminar);

// Función para manejar la obtención de todos los abonos
async function todosVistaAbonos(req, res, next) {
	try {
		const items = await controlador.todosVistaAbonos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de todos los contactos
async function todos(req, res, next) {
	try {
		const items = await controlador.todos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de un abono específico por ID
async function uno(req, res, next) {
	try {
		const items = await controlador.uno(req.params.id);
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la adición de un nuevo abono
async function agregar(req, res, next) {
	try {
		// Agregamos abono
		await controlador.agregar(req.body);

		// Obtenemos el movimiento con el id_movimiento que llega en la petición
		const resultadoDb = await movimientos.todos();
		const movimiento = resultadoDb.filter(mov => mov.id === req.body.id_movimiento);

		// Comprobamos que existe el movimiento
		if (!movimiento) {
			throw new Error('Movimiento no encontrado.');
		}
		// Pasamos los argumentos necesarios para la función actualiza_movimiento
		const movimientoActualizado = await controlador.actualiza_movimiento(req.body.abonado, movimiento);
		await movimientos.agregar(movimientoActualizado);

		let mensaje = req.body.id === 0 ? 'Item guardado con éxito' : 'Item actualizado con éxito';
		respuesta.success(req, res, mensaje, 201);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la eliminación de un abono
async function eliminar(req, res, next) {
	try {
		// Al eliminar un abono, retrocedemos la cantidad abonada contra el movimiento al que fue asignado
		const consultaAbono = await controlador.uno(req.body.id);

		const retrocesoAbono = -Number(consultaAbono[0].abonado);

		// Obtenemos el movimiento
		const resultadoDb = await movimientos.todos();
		// Recuperamos el movimiento completo
		const idMovimiento = consultaAbono[0].id_movimiento;
		const movimiento = resultadoDb.filter(mov => mov.id === idMovimiento);

		// Actualizamos el movimiento al que referenciaba originalmente el abono
		const movimientoActualizado = await controlador.actualiza_movimiento(retrocesoAbono, movimiento);

		// Eliminamos el abono antes de actualizar el movimiento desde el módulo de movimientos, ya que la función "agregar" desde ese
		// módulo revisa el estado del movimiento buscando los abonos relacionados con él.
		await controlador.eliminar(req.body);

		// Finalmente actualizamos el movimiento
		await movimientos.agregar(movimientoActualizado);

		respuesta.success(req, res, 'Item eliminado satisfactoriamente', 200);
	} catch (err) {
		next(err);
	}
};

// Exporta el router para ser usado en otros archivos
module.exports = router;
