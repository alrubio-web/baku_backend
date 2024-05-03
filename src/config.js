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

// Importa y configura 'dotenv', un módulo que permite cargar variables de entorno desde un archivo .env
require('dotenv').config();

module.exports = {
	app: {
		port: process.env.PORT || 4000, // Si no se reconoce el puerto a partir de las variables de entorno, se utilizará el 4000
	},
	jwt: {
		secret: process.env.JWT_SECRET
	},
	mysql:{
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DB
	},
	googleAuth:{
		serviceAccountKey: JSON.parse(process.env.SERVICE_ACCOUNT_KEY),
		oauth2ClientCredentials: JSON.parse(process.env.OAUTH2_KEY),
	},
	contactoAdmin:{
		telefonoAdministrador: process.env.TEL_ADMINISTRADOR
	},
	email: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	},
	/*certs: {
		key: process.env.CERT_KEY_FILE,
		cert:  process.env.CERT_FILE
	}*/
}


