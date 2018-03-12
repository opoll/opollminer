
/*
  This module controlls the shard peer to peer functionality
*/

var ShardBlockHelper = require('../../helpers/shard_block');

const axios = require("axios");

var hook = require("../hook");

var helpers = require("../shard/helpers");

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

    var responses = await ShardLogicController.PoolManager.getResponsePool(shardID);//activeShards[shardID];

    // if we dont have a response list
    if (!responses) {
        res.json({ error: 404, message: "Do not have a list of responses for specified shard" });
        return;
    }
   
    res.json(responses);
};

p2p.sendNewBlock = async function (req, res) {

    var shardID = req.params.shardID;
    var blockjs = req.body.block;
    var block;

    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    if (!activeShards[shardID]) {
        console.log("Invalid shard for new block")
        return;
    }
    try {
        block = JSON.parse(blockjs);
    } catch (err) {
        console.log("Failed to parse new block");
        return;
    }

    if (block.pollHash != shardID) {
        console.log("Hash incorrect");
        return;
    }


    var ourBlock = await ShardLogicController.POWController.generateLatestBlock(shardID); // what the next block should be

    if (block.blockId != ourBlock.blockId) {
        console.log("Blockid incorrect");
        return;
    }

     /*
    var unixSeconds = Math.floor(new Date() / 1000);
    // 1800 == 30 minutes
    if (block.timestamp + 1800 < unixSeconds) {
        console.log("Timestamp is too far behind");
        return;
    }*/

    /*


    if (!block.responses || block.responses.length <= 0) {
        console.log("Block has no responses");
        return;
    }

    do more verification like checking the respondents in detail

    */


    var hash = ShardBlockHelper.hash(block);

    var hashInt = helpers.bigInt(hash, 256);
    if (hashInt.lesserOrEquals(ShardLogicController.POWController.maxHashNumber)) {
        hook.Call("shardBlockAdded", block);
    }
   
    res.end();
}

p2p.broadcastBlock = async function (shardID, blockObj) {
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
    var shard = activeShards[shardID];


    shard.peers = ["localhost:9011", "localhost:9012"]; // testing

    if (!shard.peers) {
        console.log("Can't broadcast because theres no list of peers for this shard");
        return;
    }

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
