
const chalk = require('chalk');
const bodyParser = require('body-parser');

// Create the library
var lib = {};

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
        app.route('/shard/:shardID/newblock').get(logicController.p2p.sendNewBlock); 
        // return the json of specified block for shard
        app.route('/shard/:shardID/:blockID/block').get(logicController.p2p.reqNextBlock); 
  }

  /*
    Configure routes related to the mainchain
  */
  if( nodeType == "mainchain" ) {
    console.log( chalk.magenta("[NET] ") + "Configuring mainchain P2P routes" );
    // TODO
  }

  // Start Listening
  app.listen( port, function () {
      console.log( chalk.magenta("[NET] ") + "Listening on port %d in %s mode", this.address().port, app.settings.env );
  } );
}

// Export
module.exports = lib;
