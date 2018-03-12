
/*
  This module controlls the shard peer to peer functionality
*/
const axios = require("axios");

var p2p = {};

// The logic controller
var ShardLogicController = undefined;

// Variable to store databases (injected by logic controller)
var databases = undefined;


/*
  Request a list of peers this node is aware of listening on the
  provided shard
*/

p2p.reqPeers = async function (req, res) {
    var shardID = req.params.shardID;

    // get list of active shards locally
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    // check shard validity (should make a lib function to do this?)
    if (!activeShards[shardID]) {
        res.json({ error: 404, message: "Invalid ShardID specified" });
        return;
    }

    var shard = activeShards[shardID];

    // if we dont have a peer list
    if (!shard.peers) { 
        res.json({ error: 404, message: "Do not have a list of peers for specified shard" });
        return;
    }

    // if we are storing the peers via .peers array in the shard itself
    res.json(shard.peers);
    
};

p2p.reqNextBlock = async function (req, res) {
    var shardID = req.params.shardID; // shard/poll hash
    var blockID = req.params.blockID; // the block number they need  (1-99999999);

    // get list of active shards locally
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    // check shard validity (should make a lib function to do this?)
    if (!activeShards[shardID]) {
        res.json({ error: 404, message: "Invalid ShardID specified" });
        return;
    }

    var shard = activeShards[shardID];
    // if we dont have the block
    if (!shard.blocks || !shard.blocks[blockID]) {
        res.json({ error: 404, message: "Do not have the block for specified shard" });
        return;
    }

    res.json(shard.blocks[blockID]); // send the block
};

p2p.reqResponses = async function (req, res) {
    var shardID = req.params.shardID;

    // get list of active shards locally
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    // check shard validity (should make a lib function to do this?)
    if (!activeShards[shardID]) {
        res.json({ error: 404, message: "Invalid ShardID specified" });
        return;
    }

    var shard = activeShards[shardID];

    // if we dont have a response list
    if (!shard.responses) {
        res.json({ error: 404, message: "Do not have a list of responses for specified shard" });
        return;
    }

    //if we are storing the peers via .responses array in the shard itself
    res.json(shard.responses);
    
};

p2p.sendNewBlock = async function (req, res) {
    console.log("NEWBLOCK FROM A PEER", req.post);
    res.end();
}

p2p.broadcastBlock = async function (shardID, blockObj) {
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
    if (!activeShards[shardID]) { return; }
    var shard = activeShards[shardID];
    if (!shard.peers) {
        console.log("Can't broadcast because theres no list of peers for this shard");
        return;
    }
    //console.log("sending", `http://localhost:9011/shard/${shardID}/newblock`);
    // axios.post(`http://localhost:9011/shard/${shardID}/newblock`, {block: JSON.stringify(blockObj)});

    // send the block to the peers
    shard.peers.forEach(function (ip) {
        axios.post(`http://${ip}/shard/${shardID}/newblock`, {block: JSON.stringify(blockObj)});
    });
}
// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return p2p;
} );
