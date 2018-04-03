const chalk = require('chalk');
const socketIO = require('socket.io');
let io = null;

exports.initialize = function(server) {
    io = socketIO(server);
    console.dir("io", io);

    // Log Websocket connection. This is where socket events will be reacted to although
    // the miner will primarily be pushing data via the websocket socket connection
    io.on('connection', function(socket){
        // Validate connection adminAuthToken
        if(false){
            // Disconnect connect. Token invalid.
            socket.disconnect(true);
        }

        console.log(chalk.magenta("[NET] ") + "Client websocket connection created.");
    });
};

exports.io = function () {
    return io;
};