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

// Importa la configuración del proyecto
const config = require('../../config');
const utilidades = require("../utilidades");

module.exports = function () {

	async function generarEnlaceMovimientoWhatsApp(movimiento, saldo) {
		try {
			const numeroInquilino = encodeURIComponent(movimiento.contacto_movil_whatsapp);
			const fechaFormateada = utilidades.convertirFechaISOAFechaSimple(movimiento.fecha_mov);
			const hoy = utilidades.fechaActual();

			let mensajeSaldo = '';
			if (saldo < 0) {
				mensajeSaldo = `tu saldo es de ${saldo} euros.`;
			} else if (saldo === 0 || saldo > 0) {
				mensajeSaldo = `no tienes movimientos pendientes de pago y tu saldo es de ${saldo} euros. `;
			}

			const mensaje = `Hola, ${movimiento.nombre_inquilino}:
Te informamos sobre tu próximo movimiento de tipo ${movimiento.mov_tipo} generado a ${fechaFormateada}:
${movimiento.mov_descripcion} por importe de ${movimiento.mov_total} euros.
Aprovechamos para informarte de que a ${hoy} ${mensajeSaldo}
Por favor, revisa los detalles y confírmanos.`;

			const mensajeCodificado = encodeURIComponent(mensaje);
			const urlWhatsApp = `https://wa.me/${numeroInquilino}?text=${mensajeCodificado}`;
			return urlWhatsApp;
		} catch (error) {
		throw error;
		}

	}

	async function generarEnlaceEstatusInquilinoWhatsApp(movimientosPendientes, saldo, telefono, nombreInquilino) {
		try {
			const numeroInquilino = encodeURIComponent(telefono);
			const numeroAdministrador = encodeURIComponent(config.contactoAdmin.telefonoAdministrador);
			const fechaActual = utilidades.fechaActual();

			let mensajeSaldo = '';
			let mensaje = '';
			let mensajeAdministrador='';

			if (saldo < 0) {
				mensajeSaldo = `tu saldo actual es de ${saldo} euros.`;

				if(movimientosPendientes.length > 1){
					mensaje = `Hola, ${nombreInquilino}:
Te informamos que a ${fechaActual} tienes varios movimientos pendientes y ${mensajeSaldo}
Por favor, revisa los detalles y ponte en contacto con nosotros lo antes posible. Gracias.`;

				} else if (movimientosPendientes.length === 1){
					mensaje = `Hola, ${nombreInquilino}:
Te informamos que a ${fechaActual} tienes un movimiento pendiente y ${mensajeSaldo};
Por favor, revisa los detalles y ponte en contacto con nosotros lo antes posible. Gracias.`;
				}

			} else if (saldo === 0 || saldo > 0 && movimientosPendientes.length === 0) {
				mensajeSaldo = `no tienes movimientos pendientes de pago y tu saldo es de ${saldo} euros. `;
				mensaje = `Hola, ${nombreInquilino}:
Te informamos que a ${fechaActual} ${mensajeSaldo} Muchas gracias.`;


			} else if (saldo === 0 || saldo > 0 && movimientosPendientes.length > 0) {
				mensajeAdministrador = `Mensaje para el Administrador:
Revisar asignación de movimientos y abonos del usuario ${nombreInquilino}, ya que tiene algún movimiento
en estado "pendiente" y, sin embargo su saldo es mayor o igual que cero.`;

				const mensajeCodificado = encodeURIComponent(mensajeAdministrador);
				const urlWhatsApp = `https://wa.me/${numeroAdministrador}?text=${mensajeCodificado}`;

				return urlWhatsApp;

			}

			const mensajeCodificado = encodeURIComponent(mensaje);
			const urlWhatsApp = `https://wa.me/${numeroInquilino}?text=${mensajeCodificado}`;
			return urlWhatsApp;
		} catch (error) {
			throw error;
		}
	}


	// Exporta las funciones para ser usadas en otros archivos
	return {
		generarEnlaceMovimientoWhatsApp, generarEnlaceEstatusInquilinoWhatsApp
	}
}