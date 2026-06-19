const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

router.post('/validar-cupo', ventasController.validarCupo);
router.post('/procesar', ventasController.procesarVenta);
router.get('/reporte', ventasController.getReporte);

module.exports = router;
