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
const seguridadRol = require("../usuarios/seguridadRol"); // Importa el controlador de contactos

// Creación del router de Express
const router = express.Router();

// Definición de rutas.js
router.get('/', todos);
router.get('/detalleVista', todos_detalle_vista);
router.post('/', seguridadRol(), agregar);
router.delete('/', seguridadRol(), eliminar);

// Función para manejar la obtención de todos los inmuebles_propietarios
async function todos(req, res, next) {
	try {
		const items = await controlador.todos();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};

// Función para manejar la obtención de todos los inmuebles_propietarios de la vista con detalle de nombre propietario
async function todos_detalle_vista(req, res, next) {
	try {
		const items = await controlador.todos_detalle_vista();
		respuesta.success(req, res, items, 200);
	} catch (err) {
		next(err);
	}
};


// Función para manejar la adición de un nuevo cliente
async function agregar(req, res, next) {
	try {
		const items = await controlador.agregar(req.body);
		let mensaje = req.body.id == 0 ? 'Item guardado con éxito' : 'Item actualizado con éxito';
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

// Exporta el router para ser usado en otros archivos
module.exports = router;
