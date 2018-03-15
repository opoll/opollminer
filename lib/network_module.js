
const chalk = require('chalk');
const bodyParser = require('body-parser');

// Create the library
var lib = {};

// Admin Logic + Middleware
const adminController = require('./admin/controller')
const adminMid = require('./admin/middleware');

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

    app.route( '/shard/peers' ).get( logicController.p2p.reqPeers );

    // Token Restricted Administrative Endpoints For Shard Miner
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);
  }

  /*
    Configure routes related to the mainchain
  */
  if( nodeType == "mainchain" ) {
    console.log( chalk.magenta("[NET] ") + "Configuring mainchain P2P routes" );
    
    // Token Restricted Administrative Endpoints For Mainchain Miner
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);
    // app.route('/admin/').get(adminController);

  }

  //Token Restricted Administrative Endpoints For Wallet (both miner types share these endpoints)
  app.route('/admin/wallets').all(adminMid.verifyToken).get(adminController.getWalletsInfo);
  app.route('/admin/wallets/:walletId/event').all(adminMid.verifyToken).get(adminController.getWalletKeys);
  app.route('/admin/:walletId').all(adminMid.verifyToken).delete(adminController.deleteWallet);
  app.route('/admin/wallets/event').all(adminMid.verifyToken).get(adminController.exportWallets);
  app.route('/admin/wallets').all(adminMid.verifyToken).post(adminController.addWallet);

  // Start Listening
  app.listen( port, function () {
      console.log( chalk.magenta("[NET] ") + "Listening on port %d in %s mode", this.address().port, app.settings.env );
  } );
}

// Export
module.exports = lib;
