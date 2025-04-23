const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const os = require('os');

// Function to get all local IP addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                addresses.push(addr.address);
            }
        }
    }
    return addresses;
}

// Import merged server classes
const { Game } = require('./server/ServerClasses');

// constants
const PORT = process.env.PORT || 5000;
const FRAME_TIME = Math.floor(1000 / 60);

var app = express();
var server = http.Server(app);

// Configure Socket.IO with more permissive settings
var io = socketIO(server, {
    pingInterval: 2000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    maxHttpBufferSize: 1e8,
    connectTimeout: 45000,
    serveClient: true
});

let game = new Game(io);

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.set('port', PORT);
app.use('/Assets/img', express.static(path.join(__dirname, 'Assets/img')));
app.use('/Assets/sounds', express.static(path.join(__dirname, 'Assets/sounds')));
app.use('/client/public', express.static(path.join(__dirname, 'client/public')));
app.use('/build', express.static(path.join(__dirname, 'build')));

// Routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/public/index.html'));
});

// GAME CLOCK
setInterval(function() {
    if (game) {
        game.update();
        game.sendState();
    }
}, FRAME_TIME);

// Start the server on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log('\nServer is running!');
    console.log('\nPlayers can connect using any of these addresses:');
    console.log('➜ Local machine: http://localhost:' + PORT);
    ips.forEach(ip => {
        console.log(`➜ Local network: http://${ip}:${PORT}`);
    });
    console.log('\nServer is configured to accept multiple connections');
});