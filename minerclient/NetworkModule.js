var helpers = require("./helpers");
exports.API = require("./NetworkModuleAPI");

exports.StartListen = function () {
    helpers.log("SERVER INIT");

    // copy pasta express startup code from ico-api
    var express = require('express'),
        app = express(),
        port = process.env.MINERPORT || 9011,
        cors = require('cors');
        


    // bad?
    app.use(cors());

    // Parse input as json..
    app.use(helpers.bodyParser.urlencoded({ extended: true }));
    app.use(helpers.bodyParser.json());


    // setup listen server
    var listenserver = require('./listenserver');

    listenserver(app);

    // Start Listening
    app.listen(port, function () {
        console.log("Listening on port %d in %s mode", this.address().port, app.settings.env);
    });
}

