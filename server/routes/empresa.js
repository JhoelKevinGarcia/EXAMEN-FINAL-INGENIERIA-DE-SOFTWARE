const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');

router.get('/', empresaController.getEmpresa);
router.put('/actualizar', empresaController.actualizarEmpresa);
router.get('/estadisticas', empresaController.getEstadisticas);

module.exports = router;
