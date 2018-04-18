/* Transaction pooling and management */
var hook = require("./hook");
var level = require("level");
var axios = require("axios");

var MainLogicController = undefined;
var lib = {};

module.exports = function (logic) {
    MainLogicController = logic;
    return lib;
}

lib.db = {
    transactions: level("./db/transactions"),
}

lib.Pool = {};

/* Store transaction locally */
lib.AddTransaction = async function (trans) {
    lib.Pool[trans.hash] = trans;
    lib.db.transactions.put(trans.hash, trans);
}

/* Validate a transaction */
lib.ValidateTransaction = async function (trans, peer) {
    // TODO: Validate schema
    /*
        if (!validateschema(trans)){
            return false;
        }
    */

    /*
        TODO: Validate address owner (public key etc...)
    */

    // Add the transaction locally after its been validated
    lib.AddTransaction(trans);
}

/* Remove from pool if you receive a validated block that has these transactions */
lib.RemoveTransaction = async function (transHash) {
    delete lib.Pool[transHash];
}
/* Get a list of transactions to be placed in next block */ 
lib.GetPool = async function () {
    return lib.Pool;
}

/* Parse json list received from a peer */
lib.ParseTransactions = function (jdata) {
    try {
        var list = JSON.parse(jdata);
        for (var transHash in list) {
            // Validate the data
            lib.ValidateTransaction(list[transHash]);
        }
    } catch (err) { } // we dont care if the parse failed from a random peer
}

/* Refresh transaction list by asking peers */
hook.Add("networkTick", "refreshTransactions", function () {
    var peers = MainLogicController.getRandomPeers();
    peers.forEach(function (ip) {
        axios.get(`http://${ip}/main/transactions`).then(function (resp) {
            lib.ParseTransactions(resp.data);
        }).catch(function () { });
    });
});