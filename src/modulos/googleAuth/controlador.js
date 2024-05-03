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
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

// Importa la configuración del proyecto
const config = require('../../config');

module.exports = function() {
	async function authorizeDrive() {
		const serviceAccount = config.googleAuth.serviceAccountKey;

		const SCOPES = ['https://www.googleapis.com/auth/drive'];

		const jwtClient = new google.auth.JWT(
			serviceAccount.client_email,
			null,
			serviceAccount.private_key,
			SCOPES
		);

		await jwtClient.authorize();

		return jwtClient;
	}

	function createOAuth2Client() {
		// Leer credenciales
		const oauth2ClientCredentials = config.googleAuth.oauth2ClientCredentials;

		// Acceder a las credenciales bajo la clave 'web'.
		const credentials = oauth2ClientCredentials.web;

		// Crear una nueva instancia de OAuth2Client con las credenciales correctas.
		return new OAuth2Client(
			credentials.client_id,
			credentials.client_secret,
			credentials.redirect_uris[0]
		);
	}

	function getAuthUrl() {
		const oAuth2Client = createOAuth2Client();
		const SCOPES = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
		});

		return authUrl;
	}

	async function getUserInfoAndTokens(code) {
		const oAuth2Client = createOAuth2Client();
		const { tokens } = await oAuth2Client.getToken(code); // Obtener el token de Google
		oAuth2Client.setCredentials(tokens);

		const oauth2 = google.oauth2({
			auth: oAuth2Client,
			version: 'v2'
		});

		const userInfo = await oauth2.userinfo.get();

		// Devuelve tanto los datos del usuario como los tokens de Google
		return { userInfo: userInfo.data, tokens };
	}

	// Esta función espera un token de acceso de Google
	async function revokeGoogleToken(googleAccessToken) {
		const oAuth2Client = createOAuth2Client();
		try {
			await oAuth2Client.revokeToken(googleAccessToken);
			console.log('Google access token revoked');
		} catch (error) {
			throw error;
		}
	}



	return {
		authorizeDrive,
		getAuthUrl,
		getUserInfoAndTokens,
		revokeGoogleToken
	};
};