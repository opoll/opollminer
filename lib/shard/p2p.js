
/*
  Shard P2P Controller
  (c) 2018 OpenPoll Inc
  ==============================================================================
  This module handles all peer to peer communication among nodes mining shard
  blockchains.
*/

var ShardBlockHelper = require('@openpoll/helpers').shardBlock;
var ShardNetworkModule = require('./net');
const axios = require("axios");
var hook = require("../hook");
var helpers = require("./helpers");

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

/*
    An endpoint for peers to query other peers and gather their response pool.
    P2P based response propagation
*/
p2p.reqResponses = async function (req, res) {
    // Get the shard id being queried for
    var shardID = req.params.shardID;

    // Get a list of active shards locally
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    // Check if the shard being queried for is active 
    // TODO: Check if there is a simple call to do this
    if (!activeShards[shardID]) {
        res.json({ error: 404, message: "Invalid ShardID specified" });
        return;
    }

    // Get the responses stored locally
    var responses = await ShardLogicController.PoolManager.getResponsePool(shardID);

    // if we dont have a response list
    if (!responses) {
        res.json({ error: 404, message: "Do not have a list of responses for specified shard" });
        return;
    }
    
    // Transmit the shard response pool
    res.json(responses);
};

var WorkedShardChallenges = {};

/*
    When the miner begins mining a new shard, broadcast to the remote pool manager that
    this peer is associated with that shard. Get the remote pool manager challenge and
    store locally.
*/
hook.Add("BeginMiningShard", "announceToAPI", async function (shardID) {
    // Get the URL
    var url = ShardNetworkModule.API_URL + `/shards/${shardID}/peers`;

    // Query the remote pool manager
    var resp = await axios.post(url, { port:global.listener.address().port}).then(function (resp) {
        // Store the challenge
        ShardLogicController.POWController.StartMining(shardID);
    }).catch(function (err) {
        console.log(err);
        // If there was an error connecting to the remote pool manage
        console.log("could not get challenge request / could not connect to pool manager");
    });
})

/*
    When the miner attempts to join the remote peer manager, the remote peer manager
    will query the remote peer and ask for a challenge to ensure ports are open and
    data can be recieved.
    ** There is a new challenge for each shard the miner attempts to join
*/ 
p2p.reqMiningChallenge = async function (req, res) {
    res.json({ token: req.body.token });
}

// Mainchain request for entire block chain
p2p.reqEntireChain = async function (req, res) {
    var shardID = req.params.shardID;

    var latestBlock = await ShardLogicController.BlockManager.getLongestChain(shardID);
    var entireChain = await ShardLogicController.BlockManager.getEntireChain(latestBlock.hash);

    res.json(entireChain || {});
}

/*
    An endpoint to allow other peers on the network to provide a shard identifier
    and query for the latest bock on the longest chain assocaited with that shard
    which is stored locally
*/ 
p2p.reqLatestBlock = async function (req, res) {
    var shardID = req.params.shardID;
    var latestBlock = await ShardLogicController.BlockManager.getLongestChain(shardID);
    res.json(latestBlock);
}

/*
    An endpoint to allow other peers on the network to provide a block hash
    which the local peer checks local storage and returns the associated block
*/
p2p.reqBlock = async function (req, res) {
    var blockHash = req.params.blockHash;
    var block = await ShardLogicController.BlockManager.GetBlockByHash(blockHash);
    res.json(block || {});
}

/*
    Network is called periodically
    PURPOSE:
        * Refresh list of peers, on each shard
        * Update the response pool on each active shard
        * Check for block updates
    Essentially, keeps the miner up to date with the network for all shards
*/

hook.Add("networkTick", "refreshPeerList", async function () {
    // Get lists of worked & active shards
    var workingShards = await ShardLogicController.WorkedShardsModule.getWorkedShards();
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();

    // Go through each worked shard
    workingShards.forEach(async function (pollHash) {
        // Get the shard metadata
        var shard = activeShards[pollHash];

        // Refresh all peers on the shard
        ShardLogicController.ActiveShardsModule.refreshPeers(pollHash);

        // Refresh all responses on the shard
        ShardLogicController.ActiveShardsModule.refreshResponses(pollHash);

        // Default peer list to empty.. this will be an issue...
        var peers = shard.peers || [];

        // Go through each peer on the shard
        peers.forEach(function (peer) {
            // TEMPORARY DEVELOPMENT ALPHA CODE
            ip = peer.ipAddress.replace("100.15.126.88", "localhost");

            // Query each peer and get the latest block
            axios.get(`http://${ip}:${peer.port}/shard/${pollHash}/latestblock`).then(async function (resp) {
                // Get the longest chain we have locally
                var latestChain = await ShardLogicController.BlockManager.getLongestChain( pollHash );

                // Validate the block we got from the peer
                // If it was longer, update it locally
                console.log("validating peer", ip);
                try{
                var validated = await ShardLogicController.BlockManager.ValidateBlock(resp.data, ip);
            }catch(err){
                console.log("error:",err);
            }
                // If the peer's block is valid
                if( validated ) {
                    console.log("VALIDATED", ip);
                    // Get the longest chain (to check if anything is different)
                    var next = await ShardLogicController.BlockManager.getLongestChain(pollHash);
                    
                    // If the longest chain was updated...
                    if (latestChain.hash != next.hash) {
                        // Dev Print
                        console.log("found better chain!");

                        // Refresh the mining state so we switch to mining the new poll
                        ShardLogicController.POWController.StopMining(pollHash);
                        ShardLogicController.POWController.StartMining(pollHash);
                    }
                    console.log("NO NEW CHAIN");
                }
            }).catch(function (err) {
                // We had trouble communicating with the peer
                // TODO: Blacklist the peer, or log the peer had a communication error
            });
        })

        // *****************************************
        // DEPRECATED IMPLEMENTATION BELOW
        // AS OF ALPHA 0.0.6
        // *****************************************

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

// *****************************************
// DEPRECATED IMPLEMENTATION BELOW
// AS OF ALPHA 0.0.6
// *****************************************
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

p2p.broadcastBlock = async function (shardID, blockObj) {

    var validated = await ShardLogicController.BlockManager.ValidateBlock(blockObj);

    if (validated) {
        /*
        var ledger = await ShardLogicController.LedgerManager.blockhashToLedger(blockObj.hash, "responses");
        await ledger.open();
        var total = await ShardLogicController.LedgerManager.countKeys(ledger);
        await ledger.close();
        console.log("counted " +total+ " entries")*/
    }
    // *****************************************
    // DEPRECATED IMPLEMENTATION BELOW
    // AS OF ALPHA 0.0.6
    // *****************************************

    /*var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
   var shard = activeShards[shardID];

   //shard.peers = ["localhost:9011", "localhost:9012"]; // testing
  
   if (!shard.peers) {
       console.log("Can't broadcast because theres no list of peers for this shard");
       return;
   }*/
    // validate our block

    /*
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

// *****************************************
// DEPRECATED IMPLEMENTATION BELOW
// AS OF ALPHA 0.0.6
// *****************************************
p2p.sendNewBlock = async function (req, res) {
    res.end(); // we dont respond back in this

    var IP = req.connection.remoteAddress;
    var port = req.connection.remotePort;

    var block = req.body;

    var peer = `${IP}:${port}`;

    if (!block || !block.hash){ return; }

    try {
        if (block.pollHash){
            // Generate block hash
            var blockhash = await ShardBlockHelper.hash(block);
            // Check if we have the block already, so we dont waste time validating it
            var blocktemp =  await ShardLogicController.BlockManager.GetBlockByHash(blockhash);
            // We already have the block, we are not going to validate this
            if (blocktemp){ return; }

            // Validate the block
            var validated = await ShardLogicController.BlockManager.ValidateBlock(block);
            
            // If its validated check if its latest block
            if (validated){
                ShardLogicController.POWController.StartMining(block.pollHash);
            }
        }else{
            // Generate block hash
            var blockhash = await global.MainLoginController.BlockHelper.hash(block);
            // Check if we have the block already, so we dont waste time validating it
            var blocktemp =  await ShardLogicController.BlockManager.GetBlockByHash(blockhash);
            // We already have the block, we are not going to validate this
            if (blocktemp){ return; }

            // Validate the block
            var validated = await global.MainLoginController.BlockManager.ValidateBlock(block);
            
            // If its validated check if its latest block
            if (validated){
                global.MainLoginController.POWController.StartMining(block.pollHash);
            }
        }
    }catch(err){
        console.log("received bad block");
    }
}

// Obtain list of mainchain peers in order to broadcast completed shard
p2p.getMainchainPeers = async function(){
    var resp = await axios.get(`${process.env.FACILITATOR_HOST}/mainchain/peers`)
    return resp.data;
}


hook.Add("ShardCompleted", "announce_to_mainchain", async function (pollHash, peer) {
    await ShardLogicController.WorkedShardsModule.removeWorkingShard(pollHash);
    if (!peer){return;}
    var peers = await p2p.getMainchainPeers();
    console.log("Sending completed shard to: ", peers);
    // No peers? Should never happen, should we broadcast to fellow shard miners?
    if (!peers || peers.length <= 0){ return; }
    var myPort = global.listener.address().port;
    // Send the shard complete request to mainchain miners
    peers.forEach(async function(peer){
        var ip = peer.ipAddress.replace("100.15.126.88", "localhost");
        axios.get(`http://${ip}:${peer.port}/main/${pollHash}/${myPort}/shardcomplete`).then(function(){}).catch(function(err){});
    });
});


// Load databases and export library
module.exports = (function( _databases, _controller ) {
  databases = _databases;
  ShardLogicController = _controller;
  return p2p;
} );
