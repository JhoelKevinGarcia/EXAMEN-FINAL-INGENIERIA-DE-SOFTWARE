const express = require('express');
const router = express.Router();
const tanquesController = require('../controllers/tanquesController');

router.get('/', tanquesController.getTanques);
router.post('/crear', tanquesController.crearTanque);
router.put('/:id', tanquesController.actualizarTanque);
router.delete('/:id', tanquesController.eliminarTanque);
router.get('/:id/stock', tanquesController.getStockActual);

module.exports = router;
