import SensorData from '../models/sensor.model.js';
import handleError from '../../utils/error.js';

// Get all sensor data (limited to 5 documents)
const getAllSensorData = async (req, res) => {
    try {
        const result = await SensorData.find().limit(5);
        res.status(200).json(result);
    } catch (err) {
        const message = err.message || 'Error retrieving sensor data';
        res.status(500).json({ error: message });
    }
};

// Get sensor data by ID
const getSensorDataById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await SensorData.findById(id);
        if (!result) {
            throw new handleError('Sensor data not found', 404);
        }
        res.status(200).json(result);
    } catch (err) {
        const message = err.message || 'Error retrieving sensor data';
        res.status(err.statusCode || 500).json({ error: message });
    }
};

// Get sensor data within a specific time range
const getSensorDataWithinRange = async (req, res) => {
    try {
        const { timeStart, timeEnd } = req.body;
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - timeEnd);

        const endTime = new Date();
        endTime.setHours(endTime.getHours() - timeStart);

        const result = await SensorData.find({
            timestamp: { $gte: startTime, $lte: endTime }
        });

        if (!result || result.length === 0) {
            throw new handleError('No sensor data found within the specified range', 404);
        }

        res.status(200).json(result);
    } catch (err) {
        const message = err.message || 'Error retrieving sensor data';
        res.status(err.statusCode || 500).json({ error: message });
    }
};

// Create new sensor data
const createSensorData = async (req, res) => {
    try {
        const { temperature, pressure, airQuality, lightIntensity } = req.body;
        const newSensorData = new SensorData({
            temperature: temperature,
            pressure: pressure,
            air_quality: airQuality,
            light_intensity: lightIntensity
        });

        const result = await newSensorData.save();
        res.status(201).json(result);
    } catch (err) {
        const message = err.message || 'Error creating sensor data';
        res.status(500).json({ error: message });
    }
};

// Delete sensor data by ID
const deleteSensorData = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await SensorData.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
            throw new handleError('No document found with the given ID', 404);
        }
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        const message = err.message || 'Error deleting sensor data';
        res.status(err.statusCode || 500).json({ error: message });
    }
};

// Export all functions
export  {
    getAllSensorData,
    getSensorDataById,
    getSensorDataWithinRange,
    createSensorData,
    deleteSensorData
};

const sensorModel = {
    getAllSensorData,
    getSensorDataById,
    getSensorDataWithinRange,
    createSensorData,
    deleteSensorData
};
export default sensorModel;