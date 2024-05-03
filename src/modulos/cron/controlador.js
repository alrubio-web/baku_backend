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

const cron = require('node-cron');
const movimientos = require('../movimientos');
const moment = require('moment'); // Para manejar fechas
const contactos = require('../contactos');
const contratos = require('../contratos');

module.exports = function(){
	function clonarYActualizarMovimiento(movimiento, nuevaFecha) {
		let nuevaFechaFormateada = nuevaFecha.format('YYYY-MM-DD');
		// Clonar el movimiento y actualizar los campos necesarios
		let nuevoMovimiento = {...movimiento, id: 0, fecha: nuevaFechaFormateada};
		return nuevoMovimiento;
	}

	async function revisarYGenerarMovimientos() {
		let hayNuevosMovimientos;
		let contador = 0;
		const ahora = moment();

		do {
			hayNuevosMovimientos = false; // Inicializamos la bandera en falso para cada iteración
			try {
				const todosLosMovimientos = await movimientos.todos();
				const movimientosFiltrados = todosLosMovimientos.filter(mov =>
					mov.tipo === 'periódico'
				);

				for (const movimiento of movimientosFiltrados) {

					const fechaMovimiento = moment(movimiento.fecha);

					let nuevaFecha = fechaMovimiento.clone().add(1, 'months'); // Clonamos
					// fechaMovimiento para no arrastrar valores en fechaMovimiento debido a la
					// mutabilidad de los objetos de tipo Moment

					// Comprueba si hay movimientos futuros para el mismo contrato, propietario y pagador
					const existenMovimientosFuturos = movimientosFiltrados.some(mov =>
						mov.id_contrato === movimiento.id_contrato &&
						mov.propietario === movimiento.propietario &&
						mov.pagadero_por === movimiento.pagadero_por &&
						moment(mov.fecha).isAfter(fechaMovimiento, 'day')
					);
					const contrato = await contratos.uno(movimiento.id_contrato);
					const estadoContrato = contrato[0].estado;

					if (!existenMovimientosFuturos && estadoContrato &&
						moment(nuevaFecha).isSameOrBefore(moment(ahora, 'day')) &&
						moment(nuevaFecha).isBefore(moment(movimiento.Fecha_fin))) {
						// Clonar y actualizar movimiento
						let nuevoMovimiento = await clonarYActualizarMovimiento(movimiento, nuevaFecha);
						const idMovimientoAgregado = (await movimientos.agregar(nuevoMovimiento)).insertId;

						if (idMovimientoAgregado) {
							hayNuevosMovimientos = true; // Actualizamos el flag si se agrega un
							// nuevo movimiento para mantener el flujo dentro del do while y hacer
							// las comprobaciones incluyendo los nuevos movimientos.
							contador++;
						}

						// Extraemos lo necesario para enviar el movimiento por mail al inquilino llamando a movimientos
						// "uno"
						const movimientoAgregado = await movimientos.uno(idMovimientoAgregado);
						const idInquilino = movimientoAgregado[0].pagadero_por;

						// Obtenemos el email del inquilino
						const inquilino = await contactos.uno(idInquilino);
						const mailInquilino = inquilino[0].email;

						//Obtenemos el saldo del inquilino
						const saldoInquilino = await contactos.saldo(idInquilino);

						//Llamamos a la función de "movimientos" para enviar el movimiento generado
						await movimientos.enviarMailMovimiento(idMovimientoAgregado, mailInquilino, saldoInquilino);
					}

				}
			} catch (error) {
				console.error('Error al revisar y generar movimientos: ', error);
				throw error;
			}
		} while (hayNuevosMovimientos); // Continuar mientras hay nuevos movimientos

		// Construcción del mensaje de retorno basado en el contador
		let mensaje;
		if (contador === 0) {
			mensaje = `Revisados movimientos y a fecha ${ahora.format('DD-MM-YYYY')} no hay más movimientos que emitir.`;
		} else if (contador === 1) {
			mensaje = `Operación completada! Emitido ${contador} movimiento y enviada notificación por e-mail.`;
		} else {
			mensaje = `Operación completada! Emitidos ${contador} movimientos y enviadas notificaciones por e-mail.`;
		}
		return mensaje;
	}

	// Ejecutar diariamente a las 23:45
	// La expresión cron también podría incluir día, mes y año, dejamos sin definir con "*"
	async function ejecutaTareasPeriodicas(){
		cron.schedule('45 23 * * *', () => {
			console.log('Ejecutando tarea CRON para generar movimientos periódicos');
			revisarYGenerarMovimientos();
		});
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		revisarYGenerarMovimientos, ejecutaTareasPeriodicas
	}
}