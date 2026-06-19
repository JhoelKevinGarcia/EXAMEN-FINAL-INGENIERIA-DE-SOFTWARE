const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresosController');

router.post('/crear', ingresosController.crearIngreso);
router.get('/', ingresosController.getHistorial);
router.get('/historial', ingresosController.getHistorial);

module.exports = router;
