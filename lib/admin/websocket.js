
/*
  Websocket Service
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for unencapsulating the functions that establish and
  manage the WebSocket connection between the miner and the miner GUI. In order to
  prevent tight coupling the io object is exported off of this module's instance
  (which should already have had the initialize function ran) so that events can be
  emitted form anywhere in the application to keep the miner GUI up to date incase
  a user doesn't refresh their dashboard, etc. although the logic of the emitting of
  events will be abstracted away by the eventFactory module.
*/

const chalk = require('chalk');
let socketIO = require('socket.io');
let io = null;

module.exports.initialize = function(server) {
    io = socketIO(server);

    // Log Websocket connection. This is where socket events will be reacted to although
    // the miner will primarily be pushing data via the websocket socket connection
    io.on('connection', function(socket){
        // Extract origin of connection
        const origin = socket.handshake.headers.origin;

        // If origin is not this local machine's GUI disconnect the connection
        if(origin !== 'http://localhost:4200/') {
            socket.disconnect(true);
        }

        // Origin is this local machine. Connection successful.
        console.log(chalk.magenta("[NET] ") + "Client websocket connection created.");
    });
};

module.exports.io = function(){
    return io;
};