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
const express = require('express'); // Framework web para Node.js
const cors = require ('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const morgan = require('morgan'); // Middleware para registrar solicitudes HTTP
const config = require('./config'); // Importa la configuración del proyecto
const cron = require('../src/modulos/cron'); // Asegúrate de que la ruta relativa sea correcta
const seguridad = require('../src/auth/seguridad');
const cookieParser = require('cookie-parser');

// Importación de rutas.js de diferentes módulos
const usuarios = require('./modulos/usuarios/rutas');
const contactos = require('./modulos/contactos/rutas');
const inmuebles_propietarios = require('./modulos/inmuebles_propietarios/rutas');
const inmuebles = require('./modulos/inmuebles/rutas');
const contratos = require('./modulos/contratos/rutas');
const rutasCron = require('./modulos/cron/rutas');
const rentas = require('./modulos/rentas/rutas');
const abonos = require('./modulos/abonos/rutas');
const movimientos = require('./modulos/movimientos/rutas');
const authGoogle = require('./modulos/googleAuth/rutas');
const error = require('./red/errors'); // Middleware para manejar errores
const fs = require('fs'); // Para acceso de archivos del sistema
const https = require('https');

// Inicialización de la aplicación Express
const app = express();

app.use(cors({
	origin: ["https://www.bakurentalmanager.site"], // Asegúrate de incluir todos los dominios necesarios
	credentials: true, // Permite cookies
}));

app.use(morgan('dev')); // Usa morgan en modo 'dev' para registrar solicitudes HTTP
app.use(express.json()); // Parsea el cuerpo de las solicitudes entrantes en un objeto JSON
app.use(express.urlencoded({extended: true})); // Parsea el cuerpo de las solicitudes entrantes con payloads URL-encoded

/* Configuración servidor HTTPS para desarrollo local - comentamos al igual que los certificados en config.js
// Configuración HTTPS
const options = {
	key: fs.readFileSync(config.certs.key),
	cert: fs.readFileSync(config.certs.cert)
};

// Crea un servidor HTTPS con tu aplicación Express
https.createServer(options, app).listen(config.app.port, () => {
	console.log(`Servidor ejecutándose en https://localhost:${config.app.port}`);
});
*/

// Escucha en el puerto proporcionado por la configuración o el entorno
const PORT = process.env.PORT || 4000; // Usará el puerto de Heroku en producción y 4000 en desarrollo local
app.listen(PORT, () => {
	console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

//Configuramos la aplicación para usar cookieParser()
app.use(cookieParser());

//Aplicamos la capa de seguridad globalmente, ya que requerimos autenticación en todas las rutas
app.use(seguridad());


// Definición de rutas.js
app.use('/api/usuarios', usuarios);
app.use('/api/contactos', contactos);
app.use('/api/inmuebles_propietarios', inmuebles_propietarios);
app.use('/api/inmuebles', inmuebles);
app.use('/api/contratos', contratos);
app.use('/api/cron', rutasCron);
app.use('/api/rentas', rentas);
app.use('/api/abonos', abonos);
app.use('/api/movimientos', movimientos);
app.use('/api/authGoogle', authGoogle);
app.use('/api/authGoogle/google', authGoogle);
app.use('/api/authGoogle/session', authGoogle);
app.use('/api/authGoogle/logout', authGoogle);
app.use(error); // Middleware para manejar errores

// Iniciar las tareas cron
cron.ejecutaTareasPeriodicas();

// Exporta la aplicación para ser usada en otros archivos
module.exports = app;
