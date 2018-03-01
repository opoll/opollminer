require('dotenv').config();
var helpers = require("./helpers");

console.log(process.env.MINERPORT);
// listen server
var NetworkModule = require("./NetworkModule");
NetworkModule.StartListen(); // start listen server


/* test console */
require("./CLI")(NetworkModule); // pass the NetworkModule so it can be access from the command base

//mnm.API.getShards();
