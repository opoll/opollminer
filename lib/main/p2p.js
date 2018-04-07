var hook = require("../hook");
var axios = require("axios");
var MainLogicController = undefined;

// Define p2p structure
var p2p = {}


// Refresh peers who are mining the main chain
p2p.refreshPeers = async function () {
    // Query API for list of main chain peers
    var peers = await axios.get(process.env.FACILITATOR_HOST_DEV + `/main/peers`);

    // No peers or API fail?
    if (!peers || !peers[0]) {
        return;
    }
}

p2p.reqLatestBlock = async function (req, res) {
    var latestBlock = await MainLogicController.BlockManager.getLongestChain()
    res.json(latestBlock || {});
}

p2p.broadcastBlock = async function (block) {
    var validated = await MainLogicController.BlockManager.ValidateBlock(block);
    if (validated) {
        //console.log("good", block);
       // MainLogicController.POWController.StopMining("mainchain");
        //MainLogicController.POWController.StartMining();
    }
    /* add block locally */
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
}

module.exports = function (databases, controller) {
    MainLogicController = controller;
    return p2p;
}