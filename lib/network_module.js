// Initialize express and app
const express = require('express');
const app = express();

// Get create server and initialize socket.io for web socket
const server = require('http').createServer(app);

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

  /*
    Configure routes related to shard nodes
  */
  if( nodeType == "shard" ) {

    console.log( chalk.magenta("[NET] ") + "Configuring shard P2P routes" );

    app.route('/shard/:shardID/peers').get(logicController.p2p.reqPeers);   
    app.route('/shard/:shardID/responses').get(logicController.p2p.reqResponses);   

    // get new block from other peers


    // return the json of specified block for shard
    app.route('/shard/:shardID/:blockID/block').get(logicController.p2p.reqNextBlock); 

    app.route('/shard/:shardID/getchain').get(logicController.p2p.reqEntireChain); 

    // new mining challenge for api
    app.route('/shard/:shardID/challenge').get(logicController.p2p.reqMiningChallenge);

    app.route('/shard/:shardID/latestblock').get(logicController.p2p.reqLatestBlock); 
    
  }
  app.route('/block/:blockHash').get(global.ShardLogicController.p2p.reqBlock);
  /*
    Configure routes related to the mainchain
  */

  if( nodeType == "mainchain" ) {
    console.log( chalk.magenta("[NET] ") + "Configuring mainchain P2P routes" );

    app.route('/mainchain/transaction').post(logicController.p2p.reqTransaction);
    app.route('/main/challenge').get(logicController.p2p.reqMiningChallenge);
    app.route('/main/latestblock').get(logicController.p2p.reqLatestBlock); 
    app.route('/main/utxo/:blockhash').get(logicController.p2p.reqUTXODigest); 
    app.route('/main/:shardID/:port/shardcomplete').get(logicController.p2p.receiveShardChain); 

    // Token Restricted Administrative Endpoints For Mainchain Miner
    app.route( '/admin/chains/mainchain' ).all(adminMid.verifyToken).get(adminController.getMainchainInfo);
    app.route( '/admin/chains/mainchain/event' ).all(adminMid.verifyToken).get(adminController.toggleMainchainState);
    app.route( '/admin/chains/mainchain' ).all(adminMid.verifyToken).delete(adminController.deleteMainchain);
  }
  // Initialize admin websocket
  require('./admin/websocket').initialize(server);

  // newblock
  app.route('/shard/:shardID/newblock').post(global.ShardLogicController.p2p.sendNewBlock);
  // Non-Token Restricted Endpoint for checking if a admin auth token is valid
  app.route( '/admin/auth' ).post(adminController.checkToken);
  app.route( '/admin/auth/:token' ).get(adminController.checkToken);
  // Token Restricted Administrative Endpoints For Shard Control
  app.route( '/admin/chains/shards' ).all(adminMid.verifyToken).get(adminController.getShardsInfo);
  app.route( '/admin/chains/shards/:shardId/event' ).all(adminMid.verifyToken).get(adminController.toggleShardState);
  app.route( '/admin/chains/shards/:shardId' ).all(adminMid.verifyToken).delete(adminController.deleteShard );

  app.route('/verify').post(logicController.p2p.reqMiningChallenge); 

  // Token Restricted Administrative Endpoints For Wallet (both miner types share these endpoints)
  app.route( '/admin/wallets' ).all(adminMid.verifyToken).get(adminController.getWalletsInfo);
  app.route( '/admin/wallets/:walletId/event' ).all(adminMid.verifyToken).get(adminController.getWalletKeys);
  app.route( '/admin/wallets/:walletId' ).all(adminMid.verifyToken).delete(adminController.deleteWallet);
  app.route( '/admin/wallets/event' ).all(adminMid.verifyToken).get(adminController.exportWallets);
  app.route( '/admin/wallets' ).all(adminMid.verifyToken).post(adminController.addWallet);

  // Token Restricted Administrative Endpoints For Notifications
  app.route( '/admin/notifications' ).all(adminMid.verifyToken).get(adminController.getNotifications);
  app.route( '/admin/notifications/:notificationId' ).all(adminMid.verifyToken).delete(adminController.deleteNotification);
  app.route( '/admin/notifications' ).all(adminMid.verifyToken).delete(adminController.deleteNotifications);

  // Start Listening on miner port
  try {
    global.listener = server.listen(minerport);
    console.log(chalk.magenta("[NET] ") + "Listening on port %d in %s mode", minerport, app.settings.env);
  }
  catch(err) {
    global.listener = server.listen(9012);
    console.log(chalk.magenta("[NET] ") + "Listening on port 9012");
  }
  
  //start the network tick
  setInterval(lib.NetworkTick, lib.TickInterval);


  if (nodeType == "mainchain") {
      hook.Call("BeginMiningMain");
  }
}

// Export Library
module.exports = lib;