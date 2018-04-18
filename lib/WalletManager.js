/* on hold */

var hook = require("./hook");
var MainLogicController = undefined;
var wallet = {}

module.exports = function (controller) {
    MainLogicController = controller;
    return wallet;
}

// Get amount of specific address in the latest ledger
wallet.getAmount = async function (address) {
    // Get latest block
    var latestBlock = await MainLogicController.BlockManager.getLongestChain();

    var ledger = latestBlock.ledger;
    // Check latests wallet ledger
    return ledger.wallets[address] || 0;
}

// Simple can afford function
wallet.canAfford = async function (address, amount) {
    // Check if address has amount according to the latest ledger
    var total = await wallet.getAmount(address);
    if ((total - amount) < 0 || amount == 0) {
        return false;
    }
    return true;
}

// Simple transaction check
wallet.transactionCheck = async function (fromAddress, toAddress, amount) {
    // Check if from address can afford the amount to be transfered
    var afford = await wallet.canAfford(fromAddress, amount);
    if (!afford) {
        return false;
    }

    // other variables
}

// Validate transaction?
wallet.ValidateTransaction = function (transaction) {

}
