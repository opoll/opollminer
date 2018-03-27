
var ShardLogicController = undefined;
var db = undefined;

var lib = {};

lib.ledgerStorage = {};

module.exports = function (databases, controller) {
    db = databases;
    ShardLogicController = controller;
    return lib;
}

lib.CalculateLedgerForChain = async function (pollHash) {
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
    var shard = activeShards[pollHash];

    var currentLedger = {};

    lib.ledgerStorage[pollHash] = lib.ledgerStorage[pollHash] || {};

    for (var blockid in shard.blocks) {
        for (var resp in shard.responces) {
            currentLedger[resp.hash] = resp;
        }
        lib.ledgerStorage[pollHash][blockid] = Object.assign({}, currentLedger);
    }
}

lib.getLedgerFromBlock = async function (pollHash, blockid) {
    var activeShards = await ShardLogicController.ActiveShardsModule.getActiveShards();
    var shard = activeShards[pollHash];

    if (!shard) { return false; }
    if (!lib.ledgerStorage[pollHash]) { return false; }
    if (!lib.ledgerStorage[pollHash][blockid]) { return false; }

    return lib.ledgerStorage[pollHash][blockid];
}