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

const inmuebles_propietarios = require ("../inmuebles_propietarios");
const contratos = require ("../contratos");
const movimientos = require ("../movimientos");
const TABLA = 'inmuebles'; // Nombre de la tabla en la base de datos
const VISTA = 'vista_informacion_inmuebles';

module.exports = function (dbInyectada) {

	let db = dbInyectada;
	if(!db){
		db = require('../../DB/mysql'); // Importa el módulo de base de datos si no se inyecta
	}

	// Función para obtener todos los inmuebles
	function todos() {
		return db.todos(TABLA);
	}

	// Función para obtener todos los inmuebles y detalles relacionados con contratos y contactos. Además.
	// se añade el saldo del contrato asociado al inmueble (la consulta de la vista incluye los detalles del contrato
	// en vigor en la fecha actual, en caso de que exista dicho contrato.
	async function inmueblesContratos() {
		let inmueblesContratos = await db.todos(VISTA);
		let consultaMovimientos = await movimientos.todos();

		for (let inmuebleContrato of inmueblesContratos){
			let contratoId = inmuebleContrato.id_contrato;
			// Obteniendo el saldo para cada inmueble/contrato
			let saldoContrato = await contratos.saldoPorContrato(contratoId, consultaMovimientos);
			// Añadiendo el saldo como un nuevo par clave-valor
			inmuebleContrato.saldo = saldoContrato;
		}
		// Devolviendo los inmuebles/contratos con su saldo correspondiente
		return inmueblesContratos;
	}

	// Función para obtener un inmueble específico por ID
	function uno(id) {
		return db.uno(TABLA, id);
	}

	// Función para agregar un nuevo inmueble
	async function agregar(body) {
		// Listas de claves para cada tabla
		const clavesInmueble = ['id', 'nombre', 'tipo', 'descripcion', 'direccion', 'geolocalizacion',
			'referencia_catastral', 'fecha_adquisicion', 'fecha_transmision',
			'precio_calculo_amoritzacion', 'precio_escriturado_transmision',
			'valor_catastral_suelo','valor_catastral', 'notas',
			'tamaño_m2', 'total_amortizaciones', 'tipo_adquisicion',
			'tipo_transmision'];

		// Construir objeto inmueble
		let inmueble = {};
		clavesInmueble.forEach(clave => {
			if (body.hasOwnProperty(clave)) {
				inmueble[clave] = body[clave];
			}
		});

		// Realizar inserción en la tabla inmuebles
		const respuesta = await db.agregar(TABLA, inmueble);
		return respuesta;
	}

	// Función para eliminar un inmueble
	function eliminar(body) {
		return db.eliminar(TABLA, body);
	}

	// Exporta las funciones para ser usadas en otros archivos
	return {
		todos, uno, agregar, eliminar, inmueblesContratos,
	}
}
