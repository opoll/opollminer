
// Imports
var helpers = require("./helpers");
exports.API = require("./NetworkModuleAPI");

/*
  This function starts the NetworkModule listen server which centralizes
  incoming networking for the mining application. This module uses an ExpressJS
  server
*/
exports.StartListen = function () {
    // Create the express server
    var express = require('express'),
        app = express(),
        port = process.env.MINERPORT || 9011,
        cors = require('cors');

    app.use(cors());

    // Parse input as json..
    app.use(helpers.bodyParser.urlencoded({ extended: true }));
    app.use(helpers.bodyParser.json());

    // Create a listen server
    var listenserver = require('./listenserver');
    listenserver(app);

    // Start Listening
    app.listen(port, function () {
        console.log("Listening on port %d in %s mode", this.address().port, app.settings.env);
    });
}
