import { Router } from 'express';
const router = Router();
// const sensorController = require('../controllers/sensors.controller');
import { createSensorData,getAllSensorData,getSensorDataWithinRange,getSensorDataById,deleteSensorData }
 from '../controllers/sensor.controller.js'; 

router.post('/', createSensorData);
router.get('/', getAllSensorData);
router.post('/search', getSensorDataWithinRange);
router.get('/:id', getSensorDataById);
router.delete('/:id', deleteSensorData);

export default router;