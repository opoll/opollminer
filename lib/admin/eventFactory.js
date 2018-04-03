
/*
  Event Factory
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module is responsible for leveraging the
*/

// Fetch instance of io object to emit events with
let socket = require('./admin/websocket').io();

socket.emit("message", {
    event: 'newshard'
});