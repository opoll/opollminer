
/*
  This module controlls the shard peer to peer functionality
*/

var ShardBlockHelper = require('@openpoll/helpers').shardBlock;;
var ShardNetworkModule = require('./net');
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

// DEPRICATED
p2p.sendNewBlock = async function (req, res) {
    res.end(); // we dont respond back in this

    var IP = req.connection.remoteAddress;
    var port = req.connection.remotePort;

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
       //console.log("Blockid incorrect");
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
        console.log("got new block " + block.blockId + " from " + IP + ":" + port)
        hook.Call("shardBlockAdded", block);
    }

    //res.end();
}

p2p.broadcastBlock = async function (shardID, blockObj) {
    await ShardLogicController.BlockManager.ValidateBlock(blockObj);

     /*var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
    var shard = activeShards[shardID];

  

    //shard.peers = ["localhost:9011", "localhost:9012"]; // testing
   
    if (!shard.peers) {
        console.log("Can't broadcast because theres no list of peers for this shard");
        return;
    }*/
    // validate our block
   

    /* DEPREICATED
    var latest = await ShardLogicController.ActiveShardsModule.getLatestBlock(shardID);//await axios.get(`http://144.217.92.196:9011/shard/${shardID}/latestblock`);
    //latest = latest.data
    //delete activeShards[shardID].blocks;
    //console.log("here");
    //await ShardLogicController.ActiveShardsModule.rebuildShardChain(shardID);
    // console.log("here1");

    //add 1 because we are counting from total blocks + new one
    var latestBlockNumber = Object.keys(shard.blocks).length - 1;
    if (latest.blockId != latestBlockNumber) {
        if (latest.blockId > latestBlockNumber) {
            // we are behind
            await ShardLogicController.ActiveShardsModule.catchupShardChain(shardID);
        } else {
            
            // we are ahead? rebuild the chain THIS SHOULD NEVER HAPPEN?
            console.log("ahead, correcting?", latest.blockId, blockObj.blockId); 
            //delete activeShards[shardID].blocks;
            await ShardLogicController.ActiveShardsModule.rebuildShardChain(shardID);
          //  ShardLogicController.POWController.StartMining(shardID);
        }
        return;
    }

    shard.blocks[blockObj.blockId] = blockObj;
    await ShardLogicController.ActiveShardsModule.saveActiveShards();
    // send the block to the peers
    shard.peers.forEach(function (ip) {
        axios.post(`http://${ip}/shard/${shardID}/newblock`, { block: JSON.stringify(blockObj) }).then(function (reply) { }).catch(function (err) { });
    });*/


}

var WorkedShardChallenges = {};

hook.Add("announceMining", "announceToAPI", async function (shardID) {
    var resp = await axios.get(ShardNetworkModule.API_URL + `/shard/${shardID}/${global.listener.address().port}/newminer`).then(function (resp) {
        WorkedShardChallenges[shardID] = resp.data.challenge;
    }).catch(function (err) {
        console.log("could not get challenge request");
    });
})


// the API recognizes you as a peer on the shard
p2p.reqMiningChallenge = async function (req, res) {
    var shardID = req.params.shardID;

    //ignore this request if theres no challenge waiting
    if (!WorkedShardChallenges[shardID]) { res.end(); return; }

    // send last challenge back to api
    res.write(WorkedShardChallenges[shardID].toString());
    res.end();

    delete WorkedShardChallenges[shardID];

    /*
        we are now registered as a peer and can start mining
        this is so other miners will be able to inform us of block updates
    */
    await ShardLogicController.POWController.StartMining(shardID);
}


p2p.reqLatestBlock = async function (req, res) {
    var shardID = req.params.shardID;
    var latestBlock = await ShardLogicController.BlockManager.getLongestChain(shardID);
    //console.log("req latest", shardID, latestBlock)
    res.json(latestBlock);
}

p2p.reqBlock = async function (req, res) {
    var blockHash = req.params.blockHash;
   // console.log("req block", blockHash)
    var block = await ShardLogicController.BlockManager.GetBlockByHash(blockHash);
    res.json(block || {});
}

/* update the list of peers so we can speak to new miners */

hook.Add("networkTick", "refreshPeerList", async function () {
    var workingShards = await ShardLogicController.WorkedShardsModule.getWorkedShards();
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    workingShards.forEach(async function (pollHash) {
        var shard = activeShards[pollHash];
        ShardLogicController.ActiveShardsModule.refreshPeers(pollHash);
        ShardLogicController.ActiveShardsModule.refreshResponses(pollHash);

        /* make sure shard is up to date */
        var peers = shard.peers || [];
        peers.forEach(function (ip) {
            ip = ip.replace("100.15.126.88", "localhost");
            axios.get(`http://${ip}/shard/${pollHash}/latestblock`).then(async function (resp) {
                var latestChain = await ShardLogicController.BlockManager.getLongestChain(pollHash);

                    
                var validated = await ShardLogicController.BlockManager.ValidateBlock(resp.data, ip);
               
                if (validated) {
                    var next = await ShardLogicController.BlockManager.getLongestChain(pollHash);
                    if (latestChain.hash != next.hash) {
                        console.log("found better chain!");
                        ShardLogicController.POWController.StopMining(pollHash);
                        ShardLogicController.POWController.StartMining(pollHash);
                    }
                }
            }).catch(function (err) {

            });
        })
        //ShardLogicController.POWController.StartMining(pollHash);
        /* DEPRICATED
        var latest = resp.data;

        var latestBlockNumber = Object.keys(activeShards[pollHash].blocks).length - 1;


        if (latest.blockId != latestBlockNumber) {
            // stop mining shard to catch up
            ShardLogicController.POWController.StopMining(pollHash);
            if (latest.blockId > latestBlockNumber) {
                // we are behind
                await ShardLogicController.ActiveShardsModule.catchupShardChain(pollHash);
            } else {
                await ShardLogicController.ActiveShardsModule.rebuildShardChain(pollHash);
            }
            ShardLogicController.POWController.StartMining(pollHash); 
        }*/

    })
});

// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return p2p;
} );
