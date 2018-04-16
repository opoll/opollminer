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
    var peers = await axios.get(process.env.FACILITATOR_HOST_DEV + `/main/peers`);

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

    // download shard chain from specific peer


    // Get the peer IP address
    var peerIP = p2p.GetIPFromString(req.connection.remoteAddress);
    // TODO: Get peer's listening port??
    var url = `http://${peerIP}:${port}/shard/${shardID}/getchain`;
    axios.get(url).then(async function (resp) {
        var data = resp.data;
        // try to parse the data returned by the peer
        try {
            var jdata = JSON.parse(data);
            var validated = await MainLogicController.BlockManager.ValidateShard(jdata);
            if (validated) {
                console.log("received a valid chain");
            }
        } catch (erro) {
            // failed to obtain data from miner
        }
    }).catch(function (err) {
        // failed to obtain data from miner
    })
}

var currentChallenge = undefined;

hook.Add("BeginMiningMain", "announceToAPI", async function (shardID) {
    // Get the URL
    var url = ShardNetworkModule.API_URL + `/main/${global.listener.address().port}/newminer`;

    // Query the remote pool manager
    var resp = await axios.get(url).then(function (resp) {
        // Store the challenge
        currentChallenge = resp.data.challenge;
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
    var shardID = req.params.shardID;

    // ignore this request if theres no challenge waiting
    if (!currentChallenge) { res.end(); return; }

    // send last challenge back to api
    res.write(currentChallenge.toString());
    res.end();

    // Delete the local challenge associated with this shard
    currentChallenge = undefined;

    // Start mining now that we are part of the peer list
    MainLogicController.POWController.StartMining();
}

hook.Add("ShardCompleted", "announce_to_mainchain", function (pollHash) {
    
});

module.exports = function (databases, controller) {
    MainLogicController = controller;
    return p2p;
}