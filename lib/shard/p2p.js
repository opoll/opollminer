
/*
  This module controlls the shard peer to peer functionality
*/

var p2p = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;

/*
  Request a list of peers this node is aware of listening on the
  provided shard
*/
p2p.reqPeers = function( req, res ) {
  res.send( 'test' );
};

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return p2p;
} );
