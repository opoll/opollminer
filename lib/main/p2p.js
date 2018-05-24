var hook = require("../hook");
var axios = require("axios");
var MainLogicController = undefined;


// Define p2p structure
var p2p = {}

// this helper will cut out the ipv6
p2p.GetIPFromString = function (ipstr) {
    if (ipstr.substr(0, 7) == "::ffff:") {
        ipstr = ipstr.substr(7)
    }
    return ipstr;
}
// Refresh peers who are mining the main chain
p2p.refreshPeers = async function () {
    // Query API for list of main chain peers
    var peers = await axios.get(process.env.FACILITATOR_HOST + `/main/peers`);

    // No peers or API fail?
    if (!peers || !peers[0]) {
        return;
    }
}

// Request the latest block we currently have
p2p.reqLatestBlock = async function (req, res) {
    var latestBlock = await MainLogicController.BlockManager.getLongestChain()
    res.json(latestBlock || {});
}

// We just mined a new block
p2p.broadcastBlock = async function (block) {
    // Validate the new block
    var validated = await MainLogicController.BlockManager.ValidateBlock(block);

}

// a shard miner letting us know they completed a shard
p2p.receiveShardChain = async function (req, res) {
    var shardID = req.params.shardID;
    var port = req.params.port;
    /* validate if shardID exists */
    res.end();
    // download shard chain from specific peer
    console.log("attempting to validate shard", shardID);

    // Get the peer IP address
    var peerIP = p2p.GetIPFromString(req.connection.remoteAddress);
    // TODO: Get peer's listening port??
    var url = `http://${peerIP}:${port}/shard/${shardID}/getchain`;
    axios.get(url).then(async function (resp) {
        var data = resp.data;
        // try to parse the data returned by the peer
        try {

            var validated = await MainLogicController.BlockManager.ValidateShard(shardID, data,`${peerIP}:${port}`);
            if (validated) {
                console.log("received a valid chain");
                var lastBlock = data[Object.keys(data).length];
                var block = await MainLogicController.BlockManager.BlockManagerBase.GetBlockByHash(lastBlock.hash);
            }else{
                console.log("failed to validate shard", shardID)
            }
           
        } catch (erro) {
            // failed to obtain data from miner
            console.log("failed to validate shard", shardID, erro)
        }
    }).catch(function (err) {
        // failed to obtain data from miner
    })
}

p2p.reqTransaction = async function (req, res) {
    res.end();
    MainLogicController.TransactionManager.ValidateTransaction(req.body);
}

var currentChallenge = undefined;

hook.Add("BeginMiningMain", "announceToAPI", async function (shardID) {
    // Get the URL
    var url = process.env.FACILITATOR_HOST + `/mainchain/peers`;

    // Query the remote pool manager
    var resp = await axios.post(url, { port: global.listener.address().port }).then(function (resp) {
        // Store the challenge
        MainLogicController.POWController.StartMining();
    }).catch(function (err) {

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

// UTXO digest endpoint for API
p2p.reqUTXODigest = async function(req, res){
    var digest = await MainLogicController.LedgerManager.getUTXODigest(req.params.blockhash);
    
    res.json(digest);
}

module.exports = function (databases, controller) {
    MainLogicController = controller;
    return p2p;
}

hook.Add("networkTick", "refreshActiveShards", function(){
    hook.Call("refreshActiveShards");
})