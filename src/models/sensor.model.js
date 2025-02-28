import { Schema, model } from 'mongoose';

const sensorSchema = new Schema({
    temperature: { type: Number, required: true },
    pressure: { type: Number, required: true },
    air_quality: { type: Number, required: true },
    light_intensity: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

const SensorData = model('SensorData', sensorSchema);

export default SensorData;