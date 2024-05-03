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
const mysql = require('mysql'); // Módulo para trabajar con MySQL
const config = require('../config'); // Importa la configuración del proyecto

// Configuración de la base de datos
const dbconfig = {
	host: config.mysql.host,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database
}

let conexion;

// Función para conectar con MySQL
function conMysql(){
	conexion = mysql.createConnection(dbconfig);

	conexion.connect((err) => {
		if(err){
			console.log(['db err'], err);
			setTimeout(conMysql, 200); // Si hay un error, intenta reconectar en 200ms
		}else{
			console.log('DB Conectada!!!: '+config.mysql.database)
		}
	});

	conexion.on('error', err => {
		console.log(['db err'], err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST'){
			conMysql(); // Si se pierde la conexión, intenta reconectar
		}else{
			throw err;
		}
	});
}

conMysql();

// Funciones CRUD para interactuar con la base de datos

// Obtener todos los registros de una tabla
function todos(tabla){
	return new Promise((resolve, reject) => {
		conexion.query(`SELECT * FROM ${tabla}`, (error, result) => {
			return error ? reject(error) : resolve(result);
		});
	});
}

// Obtener un registro específico de una tabla por ID
function uno(tabla, id){
	return new Promise((resolve, reject) => {
		conexion.query(`SELECT * FROM ${tabla} WHERE id=${id}`, (error, result) => {
			return error ? reject(error) : resolve(result);
		});
	});
}

// Agregar o actualizar un registro en una tabla
function agregar(tabla, data){
	return new Promise((resolve, reject) => {
		conexion.query(`INSERT INTO ${tabla} SET ? ON DUPLICATE KEY UPDATE ?`, [data, data], (error, result) => {
			return error ? reject(error) : resolve(result);
		});
	});
}


// Eliminar un registro de una tabla por ID o varios ID si es clave primaria compuesta
function eliminar(tabla, data) {
	return new Promise((resolve, reject) => {
		// Construir la cláusula WHERE basada en las propiedades de data
		const whereClauses = Object.keys(data).map(key => `${key} = ?`).join(' AND ');
		const values = Object.values(data);

		// Construir la consulta SQL completa
		const query = `DELETE FROM ${tabla} WHERE ${whereClauses}`;

		// Ejecutar la consulta
		conexion.query(query, values, (error, result) => {
			return error ? reject(error) : resolve(result);
		});
	});
}


// Realizar una consulta personalizada en una tabla
function query(tabla, consulta){
	return new Promise((resolve, reject) => {
		conexion.query(`SELECT * FROM ${tabla} WHERE ?`, consulta, (error, result) => {
			return error ? reject(error) : resolve(result[0]);
		});
	});
}


// Exporta las funciones para ser usadas en otros archivos
module.exports = {
	todos,
	uno,
	agregar,
	eliminar,
	query
}
