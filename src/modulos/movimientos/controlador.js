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

const template = require("../templateGenerator");
const TABLA = 'movimientos'; // Nombre de la tabla en la base de datos
const VISTA = 'vista_detalle_movimientos';
const contratos = require("../contratos");
const gD = require("../googleDrive");
const utilidades = require("../utilidades");
const whatsapp = require('../whatsapp');
const mail = require('../nodeMailer');
const abonos = require('../abonos');


module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los movimientos
	function todos() {
		return db.todos(TABLA);
	}

	// Función para obtener todos los movimientos de la vista para informes
	function todosVistaInforme() {
		return db.todos(VISTA);
	}

	// Función para obtener un movimiento específico por ID
	function uno(id) {
		return db.uno(TABLA, id);
	}

	// Función para obtener un movimiento específico por ID de la vista para informes
	function unoVistaInforme(id) {
		return db.uno(VISTA, id);
	}

	// Función para agregar un nuevo movimiento o modificarlo
	async function agregar (body) {
		try {
			// Listas de claves para la tabla movimiento
			const clavesMovimiento = ['id', 'fecha', 'tipo',
				'id_contrato', 'descripcion', 'cantidad', 'pct_iva', 'pct_retencion', 'estado', 'Fecha_inicio', 'Fecha_fin'];

			// Construir objeto movimiento
			let movimiento = {};
			clavesMovimiento.forEach(clave => {
				if (body.hasOwnProperty(clave)) {
					movimiento[clave] = body[clave];
				}
			});

			// Declaramos variable correspondiente al id del registro de movimiento en la tabla
			let insertId;

			// Si se trata de un movimiento nuevo que no sea de tipo "ad hoc", añadiremos el valor de cantidad de la renta actual
			if (body.id ===0 && body.tipo !== "ad hoc"){
				// Obtenemos la información necesaria del contrato
				const medidasContrato = await contratos.todosMedidasContratos();
				const cantidad = medidasContrato.find(renta =>
					renta.id_contrato === body.id_contrato).renta;

				const contrato = await contratos.uno(movimiento.id_contrato);
				const arrendador = contrato[0].arrendador;
				const inquilino = contrato[0].inquilino;

				// Añadimos la cantidad al movimiento
				// Clona el objeto movimiento para después añadirle la cantidad, el arrendador y el inquilino
				let movimientoConCantidad = {...movimiento};
				movimientoConCantidad.cantidad = cantidad;
				movimientoConCantidad.pagadero_por = inquilino;
				movimientoConCantidad.propietario = arrendador;

				// Realizar inserción en la tabla para que la base de datos asigne los campos calculados
				const resultado = await db.agregar(TABLA, movimientoConCantidad);
				insertId = resultado.insertId;

				//Consultamos el movimiento para acceder a los valores necesarios de los campos calculados
				let movimientoActualizado = await uno(insertId);

				// Asignamos el valor de "total" a "pendiente_movimiento" e indicamos
				// "pendiente de generar pdf" en campo url
				movimientoActualizado[0].pendiente_movimiento = movimientoActualizado[0].total;
				movimientoActualizado[0].url_documento = "pendiente generar pdf";

				// Volvemos a construir el objeto con los campos trabajados pero asegurándonos de no enviar en la query
				// los campos que genera la base de datos:
				const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
					'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
					'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

				let movimientoFinal = {};
				clavesMovimientoFinal.forEach(clave => {
					if (movimientoActualizado[0].hasOwnProperty(clave)) {
						movimientoFinal[clave] = movimientoActualizado[0][clave];
					}
				});

				let respuesta = await db.agregar(TABLA, movimientoFinal);
				return respuesta;
			}

			// Si se trata de un nuevo movimiento de tipo "ad hoc", realizaremos flujo parecido pero sin asignar la cantidad
			// desde la renta
			if (body.id ===0 && body.tipo === "ad hoc"){
				// Realizar inserción en la tabla para que la base de datos asigne los campos calculados
				const resultado = await db.agregar(TABLA, movimiento);
				insertId = resultado.insertId;

				//Consultamos el movimiento para acceder a los valores necesarios de los campos calculados
				let movimientoActualizado = await uno(insertId);

				// Asignamos el valor de "total" a "pendiente_movimiento" e indicamos
				// "pendiente de generar pdf" en campo url y "pendiente" al estado.
				movimientoActualizado[0].pendiente_movimiento = movimientoActualizado[0].total;
				movimientoActualizado[0].url_documento = "pendiente generar pdf";
				movimientoActualizado[0].estado = "pendiente";

				// Volvemos a construir el objeto asegurándonos de no enviar en la query
				// los campos que genera la base de datos:
				const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
					'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
					'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

				let movimientoFinal = {};
				clavesMovimientoFinal.forEach(clave => {
					if (movimientoActualizado[0].hasOwnProperty(clave)) {
						movimientoFinal[clave] = movimientoActualizado[0][clave];
					}
				});

				let respuesta = await db.agregar(TABLA, movimientoFinal);
				return respuesta;
			}

			//Si se trata de cambiar el estado del movimiento a "anulado", directamente realizamos esa modificación (será un
			// paso previo, posiblemente a borrar el movimiento, ya que no se puede eliminar ningún movimiento que no tenga
			// estado "anulado").
			if(body.estado === "anulado"){
				// Volvemos a construir el objeto asegurándonos de no enviar en la query
				// los campos que genera la base de datos:
				const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
					'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
					'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

				let movimientoFinal = {};
				clavesMovimientoFinal.forEach(clave => {
					if (body.hasOwnProperty(clave)) {
						movimientoFinal[clave] = body[clave];
					}
				});

				let respuesta = await db.agregar(TABLA, movimientoFinal);
				return respuesta;
			}

			//  Si se trata de una actualización de movimiento del tipo que sea,
			// agregamos a la base de datos para generar los valores de los campos calculados y llamamos a la función para
			// gestionar el estado del movimiento y su saldo
			// Volvemos a construir el objeto asegurándonos de no enviar en la query
			// los campos que genera la base de datos:
			const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
				'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
				'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

			let movimientoFinal = {};
			clavesMovimientoFinal.forEach(clave => {
				if (body.hasOwnProperty(clave)) {
					movimientoFinal[clave] = body[clave];
				}
			});

			await db.agregar(TABLA, movimientoFinal);
			let respuesta = await gestionaEstadoPendienteMovimiento(movimientoFinal.id);
			return respuesta;

		} catch (error) {
			throw error;
		}
	}

	async function gestionaEstadoPendienteMovimiento(idMovimiento) {
		//Consultamos el movimiento para acceder a los valores necesarios de los campos calculados
		let movimientoActualizado = await uno(idMovimiento);

		// Asignamos el valor de "total" a "pendiente_movimiento" y, ante la modificación, nos aseguramos de vaciar el campo url indicamos
		// hasta que el usuario imprima el movimiento o lo envíe por e-mail. También asignamos el estado como pendiente inicialmente
		// a falta de las comprobaciones posteriores.
		movimientoActualizado[0].pendiente_movimiento = movimientoActualizado[0].total;
		movimientoActualizado[0].url_documento = "";
		movimientoActualizado[0].estado = "pendiente";

		//Consultamos los abonos existentes para el id del movimiento
		const consultaAbonos = await abonos.todos();
		const abonosMovimiento = consultaAbonos.filter(a => a.id_movimiento === idMovimiento);
		const sumaAbonosMovimiento = abonosMovimiento.reduce((suma, actual) => suma + actual.abonado, 0);

		const saldoMovimiento = sumaAbonosMovimiento - movimientoActualizado[0].pendiente_movimiento;

		// Comprobamos el valor de "pendiente_movimiento" para asignar o revisar el "estado" al movimiento
		if(saldoMovimiento >0 || saldoMovimiento === 0){
			movimientoActualizado[0].pendiente_movimiento = 0;
			movimientoActualizado[0].estado = "abonado";
		} else {
			movimientoActualizado[0].pendiente_movimiento = movimientoActualizado[0].pendiente_movimiento - sumaAbonosMovimiento;
			movimientoActualizado[0].estado = "pendiente";
		};

		// Volvemos a construir el objeto asegurándonos de no enviar en la query
		// los campos que genera la base de datos:
		const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
			'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
			'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

		let movimientoFinal = {};
		clavesMovimientoFinal.forEach(clave => {
			if (movimientoActualizado[0].hasOwnProperty(clave)) {
				movimientoFinal[clave] = movimientoActualizado[0][clave];
			}
		});

		// Agregamos el movimiento gestionado a la base de datos
		const respuesta = await db.agregar(TABLA, movimientoFinal);
		return respuesta;
	}


	// Función para actualizar la url de un movimiento en la base de datos
	async function actualizaUrl(movimiento, url) {
		try {
			// Clona el objeto movimiento manteniendo todas sus propiedades
			let movimientoActualizado = {...movimiento};

			// Actualiza solo el campo específico
			movimientoActualizado.url_documento = url;

			// Volvemos a construir el objeto asegurándonos de no enviar en la query
			// los campos que genera la base de datos:
			const clavesMovimientoFinal = ['id', 'fecha', 'tipo',
				'id_contrato', 'pagadero_por', 'propietario', 'descripcion', 'cantidad', 'pendiente_movimiento',
				'pct_iva', 'pct_retencion', 'url_documento', 'estado', 'Fecha_inicio', 'Fecha_fin'];

			let movimientoFinal = {};
			clavesMovimientoFinal.forEach(clave => {
				if (movimientoActualizado.hasOwnProperty(clave)) {
					movimientoFinal[clave] = movimientoActualizado[clave];
				}
			});

			// Llama a la función agregar con el objeto actualizado
			let respuesta = await db.agregar(TABLA, movimientoFinal);
			return respuesta;
		} catch (error) {
			throw error;
		}
	}


	// Función para eliminar un movimiento
	async function eliminar(body) {
		try {
			const resultadoDb = await db.uno(TABLA, body.id);

			// Verificar si se encontró un movimiento
			if (!resultadoDb || resultadoDb.length === 0) {
				throw new Error('Movimiento no encontrado.');
			}

			const movimientoActual = resultadoDb[0]; // Acceder al primer elemento del array

			// Verificar si el estado del movimiento es "anulado"
			if (movimientoActual.estado !== "anulado") {
				throw new Error('No se puede eliminar ningún movimiento cuyo estado no sea Anulado.');
			}

			gD.eliminarTodosPdfMovimiento(movimientoActual.id);
			return db.eliminar(TABLA, body);
		} catch (error) {
			throw error;
		}
	}

	async function eliminarMovSinRestriccion(body) {
		try {
			gD.eliminarTodosPdfMovimiento(body.id);
			return db.eliminar(TABLA, body);
		} catch (error) {
			throw error;
		}
	}

	// Función para enviar un movimiento por mail
	async function enviarMailMovimiento(idMovimiento, mailInquilino, saldoInquilino) {
		try {
			let movimientoVistaInforme = await unoVistaInforme(idMovimiento);

			// Dar formato simple a cada fecha en la lista de movimientos (en este caso con sólo un elemento)
			//El método .map() crea una nueva lista basada en la lista original, aplicando la función proporcionada a cada elemento.
			movimientoVistaInforme = movimientoVistaInforme.map(mov => ({
				...mov, // Clona el movimiento
				fecha: utilidades.convertirFechaISOAFechaSimpleEsp(mov.fecha), //Sustituye la fecha
				saldo: saldoInquilino // Añade el saldo al movimiento
			}));

			const htmlContent = await template.generarEmailMovimiento(movimientoVistaInforme);
			const pdfBuffer = await imprimirMovimientosUno(idMovimiento);
			await mail.enviarEmail(mailInquilino, htmlContent, pdfBuffer);

		} catch (error) {
			throw error;
		}
	}

	async function imprimirMovimientosTodos() {
		try {
			let movimientos = await todosVistaInforme();

			// Dar formato simple a cada fecha en la lista de movimientos
			//El método .map() crea una nueva lista basada en la lista original, aplicando la función proporcionada a cada elemento.
			movimientos = movimientos.map(mov => ({
				...mov, // Clona el movimiento
				fecha: utilidades.convertirFechaISOAFechaSimpleEsp(mov.fecha) //Sustituye la fecha
			}));

			const pdfBuffer = await template.generarPdfMovimientos(movimientos);
			const fecha = utilidades.fechaActual();
			const nombreArchivo = 'todos_movimientos a_'+ fecha;

			// Guardar el pdf en Google Drive y almacenar la url
			const url = await gD.subirOActualizarArchivo(nombreArchivo, pdfBuffer);

			return pdfBuffer;

		} catch (error) {
			throw error;
		}
	}

	// Función para imprimir un movimiento
	async function imprimirMovimientosUno(id) {
		try {
			const movimiento = await uno(id);
			const movimientoVistaInforme = await unoVistaInforme(id);

			//Dar formato simple a fecha
			let fecha = movimientoVistaInforme[0].fecha;
			const fechaSimple = utilidades.convertirFechaISOAFechaSimpleEsp(fecha);

			//Clonar movimiento
			let movimientoClonado = {...movimientoVistaInforme};

			//Dar formato simple al campo fecha del movimiento clonado
			movimientoClonado[0].fecha = fechaSimple;

			const pdfBuffer = await template.generarPdfMovimientos(movimientoClonado);

			const nombreArchivo = 'id_mov '+ movimiento[0].id +'_'+ 'id_inq '+ movimiento[0].pagadero_por;

			//Guardamos el pdf en Google Drive y almacenamos la url
			const url = await gD.subirOActualizarArchivo(nombreArchivo, pdfBuffer);
			console.log(url);
			await actualizaUrl(movimiento[0], url);

			return pdfBuffer;

		} catch (error) {
			throw error;
		}
	}

	async function eliminarPdfMovimiento(body){
		try {
			const fechaFormateada = utilidades.convertirFechaISOAFechaSimple(body.fecha);
			//Reconstruimos nombre archivo a partir del body:
			const nombreArchivo = 'id_mov '+ body.id +'_'+ 'id_inq '+ body.pagadero_por;
			//Eliminamos el archivo pdf en Google Drive
			await gD.eliminarArchivo(nombreArchivo);
			const movimiento = await uno(body.id);
			await actualizaUrl(movimiento[0], "pendiente generar pdf");

		} catch (error) {
			throw error;
		}
	}

	// Función para obtener movimientos pendientes de un inquilino específico
	async function movimientosPendientesInquilino(body) {
		try {
			// Obtiene todos los movimientos
			const todosLosMovimientos = await todos();
			const idInquilino = body.id;
			// Filtra los movimientos que corresponden al inquilino y tienen pendiente_movimiento > 0
			const movimientosFiltrados = todosLosMovimientos.filter(mov =>
				mov.pagadero_por === idInquilino && mov.pendiente_movimiento > 0 && mov.estado === 'pendiente'
			);

			return movimientosFiltrados;
		} catch (error) {
			console.error('Error al obtener movimientos pendientes:', error);
			throw error;
		}
	}

	// Función para obtener movimientos pendientes de un inquilino específico con los datos de la vista para informes
	async function movimientosPendientesInquilinoVistaInforme(idInquilino) {
		try {
			// Obtiene todos los movimientos
			const todosLosMovimientos = await todosVistaInforme();
			// Filtra los movimientos que corresponden al inquilino y tienen pendiente_movimiento > 0
			const movimientosFiltrados = todosLosMovimientos.filter(mov =>
				mov.pagadero_por === idInquilino && mov.pendiente_movimiento > 0 && mov.estado === 'pendiente'
			);

			return movimientosFiltrados;
		} catch (error) {
			console.error('Error al obtener movimientos pendientes:', error);
			throw error;
		}
	}

	// Función para obtener todos los movimientos de un propietario
	async function movimientosPropietario(body) {
		try {
			// Obtiene todos los movimientos
			const todosLosMovimientos = await todos();
			const idPropietario = body.id;
			// Filtra los movimientos que corresponden al propietario
			const movimientosFiltrados = todosLosMovimientos.filter(mov =>
				mov.propietario === idPropietario
			);

			return movimientosFiltrados;
		} catch (error) {
			console.error('Error al obtener movimientos pendientes:', error);
			throw error;
		}
	}

	// Función para obtener todos los movimientos pendientes de un propietario
	async function movimientosPendientesPropietario(body) {
		try {
			// Obtiene todos los movimientos
			const todosLosMovimientos = await todos();
			const idPropietario = body.id;
			// Filtra los movimientos que corresponden al propietario
			const movimientosFiltrados = todosLosMovimientos.filter(mov =>
				mov.propietario === idPropietario && mov.pendiente_movimiento > 0 && mov.estado === 'pendiente'
			);

			return movimientosFiltrados;
		} catch (error) {
			console.error('Error al obtener movimientos pendientes:', error);
			throw error;
		}
	}

	async function enviarMovimientoPorWhatsApp(idMovimiento, saldoInquilino) {
		try {
			// Obtener el movimiento y el inquilino/contacto
			const movimientoInforme = await unoVistaInforme(idMovimiento);

			// Generar el enlace de WhatsApp
			const urlWhatsApp = whatsapp.generarEnlaceMovimientoWhatsApp(movimientoInforme[0], saldoInquilino);
			return urlWhatsApp;
		} catch (error) {
			console.error("Error al enviar movimiento por WhatsApp: ", error);
			throw error;
		}
	}

	async function enviarPendientesInquilinoWhatsApp(idInquilino, saldoInquilino, telefonoInquilino, nombreInquilino) {
		try {
			// Obtener los movimientos pendientes del inquilino con todos los detalles de la vista para informes
			const movimientosInforme = await movimientosPendientesInquilinoVistaInforme(idInquilino);
			// Generar el enlace de WhatsApp
			const urlWhatsApp = whatsapp.generarEnlaceEstatusInquilinoWhatsApp(movimientosInforme, saldoInquilino, telefonoInquilino, nombreInquilino);
			return urlWhatsApp;
		} catch (error) {
			console.error("Error al enviar estatus inquilino por WhatsApp: ", error);
			throw error;
		}
	}


	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, uno, agregar, eliminar, eliminarMovSinRestriccion, enviarMailMovimiento, imprimirMovimientosTodos,
		imprimirMovimientosUno, eliminarPdfMovimiento, movimientosPendientesInquilino,
		movimientosPropietario, movimientosPendientesPropietario, enviarMovimientoPorWhatsApp,
		enviarPendientesInquilinoWhatsApp, unoVistaInforme, todosVistaInforme
	}
}
