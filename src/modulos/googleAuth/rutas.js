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

const express = require('express');
const respuesta = require('../../red/respuestas');
const auth = require('../../auth/index');
const controladorFunciones = require('./index');
const userService = require('../usuarios/index');

const router = express.Router();

const controlador = controladorFunciones();

// Ruta para redirigir al usuario a la autenticación de Google
router.get('/google', (req, res) => {
	const authUrl = controlador.getAuthUrl();
	res.redirect(authUrl); // Redirige al usuario a la URL de autenticación de Google
});

// Ruta para manejar el callback después de la autenticación de Google
router.get('/callback', async (req, res, next) => {
	try {
		const code = req.query.code;
		if (!code) {
			throw new Error('No se proporcionó el código de autorización de Google.');
		}

		const { userInfo, tokens } = await controlador.getUserInfoAndTokens(code);
		const internalToken = auth.asignarToken({ id: userInfo.id, nombre: userInfo.name });
		console.log(userInfo);

		// Guardar userInfo en el servicio
		await userService.setUser(userInfo);
		const rol = await userService.rolUsuarioRegistrado();

		// Establecer cookies para el usuario y tokens
		res.cookie('internalToken', internalToken, {
			httpOnly: true, // La cookie no es accesible a través de JavaScript en el cliente
			secure: true, // Solo enviar la cookie sobre HTTPS
			sameSite: 'Lax' // Necesario para el envío de cookies en contextos cross-site
		});

		res.cookie('googleAccessToken', tokens.access_token, {
			httpOnly: true,
			secure: true,
			sameSite: 'Lax'
		});

// Enviar el nombre del usuario y el rol en cookies accesibles desde el frontend
		res.cookie('userName', userInfo.name, {
			secure: true, // Asegura que la cookie se envíe solo a través de HTTPS
			sameSite: 'Lax' // Permite que la cookie sea enviada en requests de tipo top-level navigation que provengan de otros sitios
		});

		res.cookie('userRol', rol, {
			secure: true,
			sameSite: 'Lax'
		});

		res.redirect('https://baku-rental-manager-frontend-fd6687d31d88.herokuapp.com');

	} catch (err) {
		next(err);
	}
});

router.get('/session', (req, res) => {
	// Verificar si el token existe
	const internalToken = req.cookies.internalToken;
	if (!internalToken) {
		// Si no hay token, se indica que no hay sesión activa
		return res.status(200).json({ isAuthenticated: false });
	}

	// Si el token existe, lo verificamos
	try {
		const isValidToken = auth.verificarToken(internalToken);
		if (isValidToken) {
			res.status(200).json({ isAuthenticated: true });
		} else {
			res.status(200).json({ isAuthenticated: false });

		}
	} catch (error) {
		console.error('Error al verificar el token:', error);
		return res.status(500).json({ error: true, message: 'Error interno del servidor al verificar el token.' });
	}
});



// Ruta para cerrar la sesión y revocar el acceso de Google
router.post('/logout', async (req, res, next) => {
	try {
		//logout vía cookies
		const googleAccessToken = req.cookies.googleAccessToken;
		console.log(googleAccessToken);
		if (googleAccessToken) {
			await controlador.revokeGoogleToken(googleAccessToken);
		}

		res.clearCookie('internalToken');
		res.clearCookie('googleAccessToken');
		res.clearCookie('userInfo');

		respuesta.success(req, res, { message: 'Sesión cerrada y acceso de Google revocado' }, 200);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
