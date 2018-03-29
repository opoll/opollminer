
const chalk = require('chalk');
const bodyParser = require('body-parser');
var hook = require("./hook");
// Create the library
var lib = {};
lib.TickInterval = 10000; // execute tick every 10 seconds

lib.NetworkTick = function () {

    try {
        hook.Call("networkTick");
    } catch (err) {
        console.log("Network tick error:", err);
    }
    
}
// Start listening
lib.listen = function( nodeType, logicController ) {
  // Setup the express listener
  var express = require('express'),
      app = express(),
      port = process.env.MINERPORT || 9011,
      cors = require('cors');

  // Allow CORS
  app.use( cors() );

  // Parse input as json..
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  /*
    Configure routes related to shard nodes
  */
  if( nodeType == "shard" ) {
        console.log( chalk.magenta("[NET] ") + "Configuring shard P2P routes" );
        app.route('/shard/:shardID/peers').get(logicController.p2p.reqPeers);   
        app.route('/shard/:shardID/responses').get(logicController.p2p.reqResponses);   
        // get new block from other peers
        app.route('/shard/:shardID/newblock').post(logicController.p2p.sendNewBlock); 
        // return the json of specified block for shard
        app.route('/shard/:shardID/:blockID/block').get(logicController.p2p.reqNextBlock); 
        // new mining challenge for api
        app.route('/shard/:shardID/challenge').get(logicController.p2p.reqMiningChallenge); 
        app.route('/shard/:shardID/latestblock').get(logicController.p2p.reqLatestBlock); 
        app.route('/block/:blockHash').get(logicController.p2p.reqBlock); 
  }

  /*
    Configure routes related to the mainchain
  */

  if( nodeType == "mainchain" ) {
        console.log( chalk.magenta("[NET] ") + "Configuring mainchain P2P routes" );
  }

  // Start Listening
      
    global.listener = app.listen(port, function () {
          console.log(chalk.magenta("[NET] ") + "Listening on port %d in %s mode", this.address().port, app.settings.env);
    }).on('error', function (err) {
        console.log(chalk.magenta("[NET] ") + "Listening on port 9012");
          global.listener = app.listen(9012);
      });

    //start the network tick
    setInterval(lib.NetworkTick, lib.TickInterval);
}

// Export
module.exports = lib;
