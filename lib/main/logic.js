/*
  Main Chain Logic controller
  (c) 2018 OpenPoll Inc
  ==============================================================================
  The shard logic controller is responsible for handling all miner level node
  logic for the miner. It does not directly perform networking outside of calls
  to other libraries, and relies heavily on shard helper libraries. This logic
  controller is also responsible for handling all local data storage interactions
  including mem, HD, and remote data pulls.
*/


// External Libraries
var http = require('http');

// Helpers
var PollHelper = require('@openpoll/helpers').poll;
var ShardBlockHelper = require('@openpoll/helpers').shardBlock;


var databases = require('../util/databases');

// The controller
var controller = {};

module.exports = controller;

// Block manager 
controller.BlockManager = require("./BlockManager")(databases, controller);


controller.initialize = async function (cli) {
    console.log("initializing main logic controller");

}