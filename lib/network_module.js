// Initialize express and app
const express = require('express');
const app = express();

// Get create server and initialize socket.io for web socket
const server = require('http').createServer(app);
let io = require('socket.io')(server);

// Set port to listen on
const minerport = process.env.MINERPORT || 9011;

// Pull in cors library
const cors = require('cors');

const chalk = require('chalk');
const bodyParser = require('body-parser');
var hook = require("./hook");

// Admin Logic + Middleware
const adminController = require('./admin/controller');
const adminMid = require('./admin/middleware');

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

  // Allow CORS
  app.use( cors() );

  // Parse input as json..
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Non-Token Restricted Once-Valid Endpoint for serving Angular Interface admin credentials and nodeType
  app.route( '/admin/info' ).get(adminController.serveAdminInfo);

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

    // Token Restricted Administrative Endpoints For Shard Miner
    app.route( '/admin/chains/shards' ).all(adminMid.verifyToken).get(adminController.getShardsInfo);
    app.route( '/admin/chains/shards/:shardId/event' ).all(adminMid.verifyToken).get(adminController.toggleShardState);
    app.route( '/admin/chains/shards/:shardId' ).all(adminMid.verifyToken).delete(adminController.deleteShard );

  }

  /*
    Configure routes related to the mainchain
  */

  if( nodeType == "mainchain" ) {

    console.log( chalk.magenta("[NET] ") + "Configuring mainchain P2P routes" );
    
    // Token Restricted Administrative Endpoints For Mainchain Miner
    app.route( '/admin/chains/mainchain' ).all(adminMid.verifyToken).get(adminController.getMainchainInfo);
    app.route( '/admin/chains/mainchain/event' ).all(adminMid.verifyToken).get(adminController.toggleMainchainState);
    app.route( '/admin/chains/mainchain' ).all(adminMid.verifyToken).delete(adminController.deleteMainchain);


  }

  // Token Restricted Administrative Endpoints For Wallet (both miner types share these endpoints)
  app.route( '/admin/wallets' ).all(adminMid.verifyToken).get(adminController.getWalletsInfo);
  app.route( '/admin/wallets/:walletId/event' ).all(adminMid.verifyToken).get(adminController.getWalletKeys);
  app.route( '/admin/wallets/:walletId' ).all(adminMid.verifyToken).delete(adminController.deleteWallet);
  app.route( '/admin/wallets/event' ).all(adminMid.verifyToken).get(adminController.exportWallets);
  app.route( '/admin/wallets' ).all(adminMid.verifyToken).post(adminController.addWallet);

  // Log Websocket connection. This is where socket events will be reacted to although
  // the miner will primarily be pushing data via the websocket socket connection
  io.on('connection', function(socket){
    // Validate connection adminAuthToken
    if(false){
        // Disconnect connect. Token invalid.
        socket.disconnect(true);
    }

    console.log(chalk.magenta("[NET] ") + "Client websocket connection created.");

    // Emit test message
    io.emit('message', {type:'new-message', text: 'success.'});
  });

  // Start Listening on miner port
  try {
    server.listen(minerport);
    console.log(chalk.magenta("[NET] ") + "Listening on port %d in %s mode", minerport, app.settings.env);
  }
  catch(err) {
    server.listen(9012);
  }
  
  //start the network tick
  setInterval(lib.NetworkTick, lib.TickInterval);

}

// Export Library
module.exports = lib;
