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
const contactos = require('../contactos');
const cron = require('../cron');
const respuesta = require('../../red/respuestas'); // Módulo para manejar respuestas
const controlador = require('./index');
const seguridadRol = require("../usuarios/seguridadRol");


// Creación del router de Express
const router = express.Router();

// Definición de rutas.js
router.get('/', todos);
router.get('/pendientesInquilino', movimientosPendientesInquilino);
router.get('/pendientesPropietario', movimientosPendientesPropietario);
router.get('/movimientosPropietario', movimientosPropietario);
router.get('/print', imprimirMovimientosTodos);
router.delete('/print', eliminarPdfMovimiento);
router.get('/print/:id', imprimirMovimientosUno);
router.get('/vistaInforme/:id', unoVistaInforme);
router.get('/vistaInforme', todosVistaInforme);
router.get('/enviarMovimiento', enviarMovimientoPorWhatsApp);
router.post('/enviarEstatus', enviarPendientesInquilinoWhatsApp);
router.post('/enviarMailMovimiento', enviarMailMovimiento);
router.get('/movimientosPeriodicos', revisarYGenerarMovimientos);
router.get('/:id', uno);
router.post('/', seguridadRol(), agregar);
router.delete('/', seguridadRol(), eliminar);


// Función para manejar la obtención de todos los contactos
async function todos(req, res, next) {
	try {
		const items = await controlador.todos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de los movimientos pendientes de un inquilino
async function movimientosPendientesInquilino(req, res, next) {
	try {
		const items = await controlador.movimientosPendientesInquilino(req.body);
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de los movimientos pendientes de un propietario
async function movimientosPropietario(req, res, next) {
	try {
		const items = await controlador.movimientosPropietario(req.body);
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de los movimientos pendientes de un propietario
async function movimientosPendientesPropietario(req, res, next) {
	try {
		const items = await controlador.movimientosPendientesPropietario(req.body);
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

//Función para obtener un movimiento de la Vista Informe de Movimientos
async function unoVistaInforme(req, res, next) {
	try {
		const items = await controlador.unoVistaInforme(req.params.id);
		res.send(items);
	} catch (err) {
		next(err); // Maneja los errores
	}
}

async function todosVistaInforme(req, res, next) {
	try {
		const items = await controlador.todosVistaInforme();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la inserción o actualización de un movimiento
async function agregar(req, res, next) {
	try {
		await controlador.agregar(req.body);
		let mensaje = req.body.id === 0 ? 'Item guardado con éxito' : 'Item actualizado con éxito';
		respuesta.success(req, res, mensaje, 201);
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

// Función para enviar un movimiento por email
async function enviarMailMovimiento(req, res, next) {
	try {
		const idMovimiento = req.body.id_movimiento;
		const movimiento = await controlador.uno(idMovimiento);
		const idInquilino = movimiento[0].pagadero_por;

		// Obtenemos el email del inquilino
		const inquilino = await contactos.uno(idInquilino);
		const mailInquilino = inquilino[0].email;

		// Obtenemos el saldo del inquilino
		const saldoInquilino = await contactos.saldo(idInquilino);

		await controlador.enviarMailMovimiento(idMovimiento, mailInquilino, saldoInquilino);

		respuesta.success(req, res, 'Mail enviado correctamente', 200);
	} catch (err) {
		next(err); // Maneja los errores
	}
}

// Función para imprimir los movimientos
async function imprimirMovimientosTodos(req, res, next) {
	try {
		const items = await controlador.imprimirMovimientosTodos();

		// Envía el buffer PDF como respuesta HTTP
		res.contentType('application/pdf');
		res.send(items);
	} catch (err) {
		next(err); // Maneja los errores correctamente
	}
}

// Función para imprimir un movimiento
async function imprimirMovimientosUno(req, res, next) {
	try {
		await controlador.imprimirMovimientosUno(req.params.id);
		respuesta.success(req, res, 'Movimiento guardado correctamente', 200);
	} catch (err) {
		next(err); // Maneja los errores
	}
}

// Función para eliminar los pdfs asociados a uno o varios movimientos
async function eliminarPdfMovimiento(req, res, next) {
	try {
		const items = await controlador.eliminarPdfMovimiento(req.body);
		res.send(items);
	} catch (err) {
		next(err); // Maneja los errores
	}
}

//Función para enviar un detalle de movimiento generado por whatsapp a un inquilino
async function enviarMovimientoPorWhatsApp(req,res,next){
	try{
		const idMovimiento = req.body.id_movimiento;
		const movimiento = await controlador.uno(idMovimiento);
		const idInquilino = movimiento[0].pagadero_por;
		const saldoInquilino = await contactos.saldo(idInquilino);

		const urlWhatsApp = await controlador.enviarMovimientoPorWhatsApp(idMovimiento, saldoInquilino);
		res.send(urlWhatsApp);
	} catch (err) {
		next(err);
	}
}

//Función para enviar un detalle de estado de cuentas de inquilino por whatsapp
async function enviarPendientesInquilinoWhatsApp(req,res,next) {
	try {
		const idInquilino = req.body.id_inquilino;
		const saldoInquilino = await contactos.saldo(idInquilino);
		const contactoInquilino = await contactos.uno(idInquilino);
		const telefonoInquilino = contactoInquilino[0].movil_whatsapp;
		const nombreInquilino = contactoInquilino[0].nombre_completo;

		const urlWhatsApp = await controlador.enviarPendientesInquilinoWhatsApp(idInquilino, saldoInquilino, telefonoInquilino, nombreInquilino);
		respuesta.success(req, res, urlWhatsApp, 200);
	} catch (err) {
		next(err);
	}
}

//Función para revisar y generar nuevos movimientos periódicos
async function revisarYGenerarMovimientos(req,res, next) {
	try {
		const mensaje = await cron.revisarYGenerarMovimientos();
		respuesta.success(req, res, mensaje, 201);
	} catch (err) {
		next(err);
	}
}


// Exporta el router para ser usado en otros archivos
module.exports = router;
