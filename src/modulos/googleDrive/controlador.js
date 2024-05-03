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

const { google } = require('googleapis');
const googleAuth = require('../googleAuth');
const { Readable } = require('stream'); // Para que el buffer que pasamos a la función subirArchivo sea un stream, que es lo que espera la API de
// Google Drive


async function subirOActualizarArchivo(nombreArchivo, buffer) {
	try {
		const jwtClient = await googleAuth().authorizeDrive();
		const drive = google.drive({ version: 'v3', auth: jwtClient });

		// Convertir el buffer en un stream
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null); // Indica el final del stream

		// Crea el objeto de metadatos para el archivo
		const fileMetadata = {
			'name': nombreArchivo,
			// Añade otros metadatos si es necesario, por ejemplo, la carpeta donde se guardará
			// 'parents': ['ID_CARPETA']
		};

		// Crea el objeto de media para el contenido del archivo
		const media = {
			mimeType: 'application/pdf',
			body: Readable.from(buffer), // El buffer que contiene el contenido del archivo PDF
		};

		// Buscar el archivo por nombre
		const fileList = await drive.files.list({
			q: `name='${nombreArchivo}' and trashed=false`,
			fields: 'files(id, name)',
		});

		console.log('buscando archivo ' + nombreArchivo);

		let fileId;
		let response;

		// Si el archivo existe, actualiza (sobrescribe) el archivo existente
		if (fileList.data.files.length > 0) {
			fileId = fileList.data.files[0].id;

			response = await drive.files.update({
				fileId: fileId,
				media: {
					mimeType: 'application/pdf',
					body: buffer,
				},
			});
			console.log('Archivo sobrescrito.');
			const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

			return fileUrl;

		} else {
			// Si el archivo no existe, crea uno nuevo
			// Sube el archivo
			const response = await drive.files.create({
				resource: fileMetadata,
				media: media,
				fields: 'id' // Puedes especificar otros campos que necesites
			});

			console.log('Archivo Subido ID:', response.data.id);
			//Obtenemos la url del archivo a partir de su identificador único en Google Drive
			const fileId = response.data.id; // El ID del archivo subido

			// Una vez subido el archivo, llamamos a compartirArchivo pasando la instancia de 'drive'
			const fileUrl = await compartirArchivo(drive, fileId);

			return fileUrl;
		}

	} catch (error) {
		console.error('Error al subir o actualizar el archivo:', error.message);
		throw new Error('Error al subir o actualizar archivo en Google Drive');
	}
}


// Compartir el archivo y obtener URL para compartir
async function compartirArchivo(drive, fileId) {
	try {
		await drive.permissions.create({
			fileId: fileId,
			requestBody: {
				role: 'reader',
				type: 'anyone',
			},
		});

		const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
		console.log('URL para compartir:', fileUrl);
		return fileUrl;
	} catch (error) {
		console.error('Error al compartir el archivo:', error.message);
		throw new Error('Error al compartir archivo en Google Drive');
	}
}


async function eliminarArchivo(nombreArchivo) {
	try {
		const jwtClient = await googleAuth().authorizeDrive();
		const drive = google.drive({ version: 'v3', auth: jwtClient });

		// Buscar el archivo por nombre
		const response = await drive.files.list({
			q: `name='${nombreArchivo}' and trashed=false`,
			fields: 'files(id, name)'
		});

		const archivos = response.data.files;
		if (archivos.length === 0) {
			console.log('No se encontró el archivo:', nombreArchivo);
			return;
		}

		// Eliminamos el primer archivo encontrado
		const fileId = archivos[0].id;

		// Eliminar el archivo
		await drive.files.delete({
			fileId: fileId
		});

		console.log('Archivo Eliminado:', nombreArchivo);
	} catch (error) {
		console.error('Error al eliminar el archivo:', error.message);
		throw new Error('Error al eliminar archivo en Google Drive');
	}
}

async function eliminarTodosPdfMovimiento(idMovimiento) {
	try {
		const jwtClient = await googleAuth().authorizeDrive();
		const drive = google.drive({ version: 'v3', auth: jwtClient });

		// Buscar todos los archivos relacionados con el idMovimiento
		const query = `name contains 'id_mov ${idMovimiento}_' and trashed=false`;
		const response = await drive.files.list({
			q: query,
			fields: 'files(id, name)'
		});

		const archivos = response.data.files;
		if (archivos.length === 0) {
			console.log('No se encontraron archivos para el movimiento:', idMovimiento);
			return;
		}

		// Eliminar todos los archivos encontrados
		for (const archivo of archivos) {
			await drive.files.delete({
				fileId: archivo.id
			});
			console.log('Archivo Eliminado:', archivo.name);
		}
	} catch (error) {
		console.error('Error al eliminar archivos:', error.message);
		throw new Error('Error al eliminar archivos en Google Drive');
	}
}





module.exports = {
	subirOActualizarArchivo, eliminarArchivo, eliminarTodosPdfMovimiento
};
