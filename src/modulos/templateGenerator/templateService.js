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

const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const puppeteer = require('puppeteer');

module.exports = function () {

	function getImageAsBase64(pathToFile) {
		// Usar `path.join` con `__dirname` para construir la ruta absoluta
		const filePath = path.join(__dirname, pathToFile);
		const fileData = fs.readFileSync(filePath).toString('base64');
		return `data:image/png;base64,${fileData}`;
	}

	// Ahora llama a la función con la ruta relativa desde la ubicación de este script
	const logoBase64 = getImageAsBase64('/image/logo.png');

	async function generarPdfMovimientos(movimientos) {
		try{
			// Leer el archivo de la plantilla Handlebars
			const templatePath = path.join(__dirname, 'movimientosPdfTemplate.hbs');
			const htmlContent = await compilarPlantilla(templatePath, movimientos);

			// Configurar Puppeteer para usar Chromium instalado por el buildpack en Heroku
			// Para ello se ha instalado el buildpack de Puppeteer en Heroku, se ha configurado
			// CHROME_BIN en Heroku con el siguiente comando: "heroku config:set CHROME_BIN=/app/.apt/usr/bin/google-chrome-stable
			// --app baku-rental-manager-backend"

			const browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				executablePath: process.env.CHROME_BIN // Usar CHROME_BIN proporcionado por el buildpack
			});

			const page = await browser.newPage();

			await page.setContent(htmlContent);
			const pdfBuffer = await page.pdf({
				format: 'A4',
				landscape: true // Establece la orientación del PDF a horizontal
			});


			await browser.close();
			return pdfBuffer;

		}catch(error) {
			throw error;
		}
	}

	async function compilarPlantilla (templatePath, data){
		const templateHtml = fs.readFileSync(templatePath, 'utf8');

		// Compilar la plantilla con Handlebars
		const template = Handlebars.compile(templateHtml);

		// Define la ruta del logo
		const logoUrl = logoBase64;

		// Ejecutar la plantilla compilada con los datos de movimientos y la ruta del logo
		const htmlContent = template({
			data,
			logoUrl // Clave usada en la plantilla
		});

		return htmlContent;
	}

	async function generarEmailMovimiento(movimiento) {
		try{
			// Leer el archivo de la plantilla Handlebars
			const templatePath = path.join(__dirname, 'movimientoEmailTemplate.hbs');
			const htmlContent = await compilarHtmlMail(templatePath, movimiento[0]);

			return htmlContent;

		}catch(error) {
			throw error;
		}
	}

	async function compilarHtmlMail (templatePath, data){
		const templateHtml = fs.readFileSync(templatePath, 'utf8');

		// Compilar la plantilla con Handlebars
		const template = Handlebars.compile(templateHtml);

		// Ejecutar la plantilla compilada con los datos de movimientos y la ruta del logo
		const htmlContent = template({
			data
		});

		return htmlContent;
	}



	// Exporta las funciones para ser usadas en otros archivos
	return {
		generarPdfMovimientos, generarEmailMovimiento
	}
}
