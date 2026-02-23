const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const userRoutes = require('./routes/userRoutes');
const officeRoutes = require('./routes/officeRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const attendanceTransumRoutes = require('./routes/attendanceTransumRoutes');
const attendanceFotoRoutes = require('./routes/attendanceFotoRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public')); // Serve admin dashboard
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploaded files

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/attendance-transum', attendanceTransumRoutes);
app.use('/api/attendance-foto', attendanceFotoRoutes);

// Helper to get the local network IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    console.log(`\n===========================================`);
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${localIP}:${PORT}`);
    console.log(`\n  Use the Network URL in React Native:`);
    console.log(`  e.g. const API_URL = 'http://${localIP}:${PORT}/api'`);
    console.log(`===========================================\n`);
});
