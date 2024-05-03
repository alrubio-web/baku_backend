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

const TABLA = 'auth'; // Nombre de la tabla en la base de datos
let currentUserInfo = null;


module.exports = function (dbInyectada) {
	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	};

	function todos() {
		return db.todos(TABLA);
	}

	const setUser = (userInfo) => {
		currentUserInfo = userInfo;
	};

	const getUserId = () => {
		return currentUserInfo.id;
	};


	const rolUsuarioRegistrado = async () => {
		const id = getUserId();

		const usuariosDb = await db.todos(TABLA);
		const usuario = usuariosDb.find(u => u.id_google === id);

		if (!usuario) {
			throw new Error("Usuario no encontrado.");
		}
		const rolDb = usuario.rol;

		return rolDb;
	};


	const chequearRol = async () => {
		try {
			const rol = await rolUsuarioRegistrado();
			return rol === "admin";
		} catch (error) {
			console.error("Error al verificar el rol:", error);
			return false; // Retorna false si hay un error al obtener el rol
		}
	}


	return {
		todos,
		setUser,
		getUserId,
		rolUsuarioRegistrado,
		chequearRol
	}
}
