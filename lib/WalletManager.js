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
    
    var amount = await MainLogicController.LedgerManager.getAmount(latestBlock.hash, address);
    // Check latests wallet ledger
    return amount;
}

// Simple can afford function
wallet.canAfford = async function (address, amount, ledger = undefined) {
    // Check if address has amount according to the latest ledger
    var total = false;
    if (ledger && ledger[address]) {
        total = ledger[address];
    } else {
        total = await wallet.getAmount(address);
    }

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
