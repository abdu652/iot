import express from 'express';
import mqtt from 'mqtt';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import { Server } from 'socket.io';
import routes from './src/routes/sensor.route.js';

import sensorModel from './src/models/sensor.model.js';
import db from './src/config/db.config.js';
import errorMiddleware from './utils/errorMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server);

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public')); // Directory for EJS files

let sensorBuffer = [];

// Middleware to parse JSON data
app.use(express.json());

// Routes
app.use('/sensor', routes);

// MQTT setup
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org', {
    port: 1883, // Use port 1883 for TCP
    clientId: 'nodejs-server-' + Math.random().toString(16).substring(2, 8), // Unique client ID
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to the sensor data topic
    mqttClient.subscribe('home/sensors/data', (err) => {
        if (err) {
            console.error('Failed to subscribe to topic:', err);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    if (topic === 'home/sensors/data') {
        const payloadStr = message.toString();
        console.log(`${topic}: payload string received: ${payloadStr}\n`);

        try {
            // Split the payload into individual values
            const values = payloadStr.split(',');

            // Convert to JSON object
            const sensorData = {
                temperature: parseFloat(values[0]),
                pressure: parseFloat(values[1]),
                airQuality: parseFloat(values[2]),
                lightIntensity: parseFloat(values[3]),
            };

            console.log('Parsed sensor data:', sensorData);

            // Update web/client with data using Socket.IO
            io.emit('sensorData', sensorData);

            // Save sensor data (average) in the database
            saveAvgSensorData(sensorData);
        } catch (err) {
            console.error('Failed to parse payload:', err);
        }
    }
});

// Endpoint to network
app.get('/', (req, res) => {
    console.log('Hello, world');
    res.status(200).send('Data received');
});

// Serve static files
app.get('/graph', (req, res) => {
    console.log('GET /graph');
    res.sendFile(path.join(__dirname, 'public/graph.html'));
});

app.get('/detail', async (req, res) => {
    try {
        const data = await sensorModel.getAllSensorData();
        res.render('detail', { data }); // Render EJS template with data
    } catch (error) {
        res.status(500).send('Error retrieving data');
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected to Socket.IO');

    // Handle checkbox data sent from the client
    socket.on('checkBoxData', (checkBoxData) => {
        console.log(`Live feedback from checkbox to MQTT: ${checkBoxData}`);
        socket.emit('x', 'mercy me');
        mqttClient.publish('esp/cmd', checkBoxData);
    });

    // Handle SensorDataWithinRange requests from the client
    socket.on('searchTimeRange', async (searchTime) => {
        try {
            const returnData = await sensorModel.getSensorDataWithinRange(searchTime);
            socket.emit('recRange', returnData);
        } catch (err) {
            console.error('Error retrieving sensor data within range:', err);
        }
    });
});

// Utility functions
function convertPayloadToObj(payloadStr) {
    const values = payloadStr.split(',');
    return {
        temperature: parseFloat(values[0]),
        pressure: parseFloat(values[1]),
        airQuality: parseFloat(values[2]),
        lightIntensity: parseFloat(values[3]),
    };
}

async function saveAvgSensorData(data) {
    sensorBuffer.push(data);

    // If 5 minutes (60 samples if collected every 5 seconds) have passed
    // Calculate the averages and save to DB
    if (sensorBuffer.length >= 5) {
        const avgTemperature = sensorBuffer.reduce((sum, d) => sum + d.temperature, 0) / sensorBuffer.length;
        const avgPressure = sensorBuffer.reduce((sum, d) => sum + d.pressure, 0) / sensorBuffer.length;
        const avgAirQuality = sensorBuffer.reduce((sum, d) => sum + d.airQuality, 0) / sensorBuffer.length;
        const avgLightIntensity = sensorBuffer.reduce((sum, d) => sum + d.lightIntensity, 0) / sensorBuffer.length;

        const dataObj = {
            temperature: parseFloat(avgTemperature).toFixed(2),
            pressure: parseFloat(avgPressure).toFixed(2),
            airQuality: parseFloat(avgAirQuality).toFixed(2),
            lightIntensity: parseFloat(avgLightIntensity).toFixed(2),
        };

        // Database query to insert sensor data (average)
        const returnData = await sensorModel.createSensorData(dataObj);
        console.log('sensorModel.createSensorData:', returnData);

        // Clear the buffer for the next interval
        console.log('sensorBuffer:', sensorBuffer);
        sensorBuffer = [];
    }
}

// Error middleware
app.use(errorMiddleware);

// Start server
server.listen(port, () => {
    db();
    console.log(`Server running on http://localhost:${port}`);
});