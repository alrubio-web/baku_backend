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

const { format } = require('date-fns');

// Función para generar la fecha actual en el momento de ejecución y darle el formato que esperamos en la base de datos.
function FechaActualAlmacenamiento() {
	const ahora = new Date();
	return format(ahora, 'yyyy-MM-dd');
}

// Función para generar la fecha actual en formato dd/MM/yyyy
function fechaActual() {
	const ahora = new Date();
	const dia = String(ahora.getDate()).padStart(2, '0');
	const mes = String(ahora.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11, por eso sumamos 1
	const anio = ahora.getFullYear();

	return `${dia}/${mes}/${anio}`;
}

function convertirFechaISOAFechaSimple(fechaISO) {
	const fecha = new Date(fechaISO);
	const año = fecha.getFullYear();
	const mes = fecha.getMonth() + 1; // getMonth() devuelve un valor entre 0 (enero) y 11 (diciembre)
	const dia = fecha.getDate();

	// Importante que el mes y el día tengan dos dígitos
	const mesFormateado = mes < 10 ? `0${mes}` : mes;
	const diaFormateado = dia < 10 ? `0${dia}` : dia;

	return `${año}-${mesFormateado}-${diaFormateado}`;
}

function convertirFechaISOAFechaSimpleEsp(fechaISO){
	const fecha = new Date(fechaISO);
	const año = fecha.getFullYear();
	const mes = fecha.getMonth() + 1; // getMonth() devuelve un valor entre 0 (enero) y 11 (diciembre)
	const dia = fecha.getDate();

	// Importante que el mes y el día tengan dos dígitos
	const mesFormateado = mes < 10 ? `0${mes}` : mes;
	const diaFormateado = dia < 10 ? `0${dia}` : dia;

	return `${diaFormateado}-${mesFormateado}-${año}`;
}


module.exports = {
	fechaActual, convertirFechaISOAFechaSimple, convertirFechaISOAFechaSimpleEsp, FechaActualAlmacenamiento
}

