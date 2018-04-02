
require('dotenv').config();

var ShardLogicController = require('./lib/shard/logic');

// Initialize shard logic controller
ShardLogicController.initialize();

// Keep the main thread idle..
// setInterval( function() {}, 3000);
