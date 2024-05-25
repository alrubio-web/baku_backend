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
const jwt = require('jsonwebtoken'); // Módulo para trabajar con JSON Web Tokens
const config = require('../config'); // Importa la configuración del proyecto

// Obtiene la clave secreta desde la configuración
const secret = config.jwt.secret;

// Función para asignar un token a un conjunto de datos
function asignarToken(data){
	// Agrega el nombre de usuario y cualquier otra información relevante al token
	const payload = {
		id: data.id, // El identificador único del usuario
		nombre: data.name // El nombre del usuario
	};
	return jwt.sign(payload, config.jwt.secret, { expiresIn: '3h' }); // Token con 3 horas de validez
}

// Función para verificar un token
function verificarToken(token){
	console.log('Verificando token');
	return jwt.verify(token, secret);
}


// Exporta las funciones para ser usadas en otros archivos
module.exports = {
	asignarToken,
	verificarToken
}
