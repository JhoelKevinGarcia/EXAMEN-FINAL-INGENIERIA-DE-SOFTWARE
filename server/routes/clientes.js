const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.get('/', clientesController.getClientes);
router.post('/crear', clientesController.crearCliente);
router.put('/:id', clientesController.actualizarCliente);
router.post('/buscar', clientesController.buscarCliente);
router.put('/:id/estado', clientesController.actualizarEstado);
router.get('/:id/historial', clientesController.getHistorialCliente);
router.get('/:id/promedio-semanal', clientesController.getPromedioSemanal);

module.exports = router;
