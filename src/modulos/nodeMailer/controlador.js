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

const nodemailer = require('nodemailer');
const config = require('../../config'); // Importa la configuración del proyecto

module.exports = function () {
	async function enviarEmail(destinatario, htmlContent, pdfBuffer) {
		try {
			// Crear un transportador
			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: config.email.user,
					pass: config.email.pass
				}
			});

			// Configurar opciones del email
			let mailOptions = {
				from: config.email.user,
				to: destinatario,
				subject: 'Movimiento Periódico',
				html: htmlContent,
				attachments: [
					{
						filename: 'movimiento.pdf', // Nombre del archivo como aparecerá en el correo
						content: pdfBuffer, // El buffer del PDF
						contentType: 'application/pdf' // Tipo MIME del archivo
					}
				]
			};

			// Enviar el mail
			let info = await transporter.sendMail(mailOptions);
			let mensaje = ('Mensaje enviado: %s', info.messageId);
			return mensaje;

			console.log('Mensaje enviado: %s', info.messageId);

		} catch (error) {
			throw error;
		}
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		enviarEmail
	}
}
