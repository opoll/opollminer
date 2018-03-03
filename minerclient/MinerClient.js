
// Setup Environment
require('dotenv').config();

// Import Helpers
var helpers = require("./helpers");

// Local Imports
var NetworkModule = require("./NetworkModule");

// Start the listens erver
NetworkModule.StartListen();

// Create a CLI
require( "./CLI" )( NetworkModule );
