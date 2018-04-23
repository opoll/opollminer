/* Transaction pooling and management */

var helpers = require('@openpoll/helpers');


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

    console.log("VERIFIED TRANSACTION:", trans.hash)
}

/*
    This will check the schema, signiture and amounts passed
    We do not need to check account balances in here, only need to validate a transaction
*/
lib.ValidateTransaction = async function(trans, peer) {
    // Validate the schema of the tranasction object
    if (!trans || !helpers.transaction.validateSchema(trans)) {
        console.log("invalid tranasction schema");
        return false;
    }

    // Attempt to validate the signature
    try {
        var validated = await helpers.transaction.validateSignature(trans, trans.respondentPublicKey);

        if (!validated) {
            console.log("invalid signiture")
            return false;
        }
    } catch (err) {
        console.log("invalid signiture check 2");
        return false;
    }

    // If the amount is less than or equal to 0
    if (trans.amount <= 0) {
        console.log("invalid amount to be transfered");
        return false;
    }

    // Add the transaction locally after its been validated
    lib.AddTransaction(trans);
}

/* Remove from pool if you receive a validated block that has these transactions */
lib.RemoveTransaction = async function (transHash) {
    delete lib.Pool[transHash];
}

/* Get a list of transactions to be placed in next block */
// TODO: https://github.com/opoll/opollminer/issues/58
lib.GetPool = async function () {
    // get the latest block
    var latestBlock = await MainLogicController.BlockManager.getLongestChain();

    // get the ledger of the latest block
    var ledger = latestBlock.ledger;
    var newList = Object.assign({}, lib.Pool);

    var tempAccountLedger = {};
    for (var transHash in newList) {
        var transaction = newList[transHash];
        // check if transaction is in previous block
        if (ledger.transactions[transHash]) {
            delete newList[transHash];
        } else {
            // check if sender can afford this transaction;
            if (!MainLogicController.WalletManager.canAfford(transaction.senderAddress, transaction.amount, tempAccountLedger)) {
                delete newList[transHash];
            } else {
                var currentAmount = await MainLogicController.WalletManager.getAmount(transaction.senderAddress);
                // store the POL taken from each transaction so we can ensure they have enough POL when sending multiple transactions
                tempAccountLedger[transaction.senderAddress] = (tempAccountLedger[transaction.senderAddress] || currentAmount) - transaction.amount;
            }
        }
    }
    // return the list of transactions now available
    return newList;
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
