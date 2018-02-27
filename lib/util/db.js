const level = require('level');
const sublevel = require('level-sublevel');

const db = sublevel(level('./db', { valueEncoding: 'json' }));

// Note sublevels are not directories in structure. They are sublevels from the top level db.
const peersDb = db.sublevel('peers'); // /db/peers

const shardsDb = db.sublevel('shards'); // /db/shards
const shardsMempoolDb = db.sublevel('shardsMempool'); // /db/shardsMempool

const mainDb = db.sublevel('main'); // /db/main
const mainMempoolDb = db.sublevel('mainMempool'); // /db/mainMempool

// Exported Module
let Db = {};

/********** Peer DB Functions **********/

// Sublevel peers structure
// peers: [
//     '98.232.217.100',
//     '204.99.187.147',
//     '38.195.78.210',
//     '77.217.44.9',
//     '141.135.87.215'
// ]

// Returns the a promise for the full list of peers from peerDb
Db.getAllPeers = function(){
    return new Promise((resolve, reject) => {
        peersDb.get('peers', function(err, peers){
            if(err){
                resolve([]);
            } else {
                return resolve(peers)
            }
        })
    });
}

// Adds a peer to the peers list in the peerDb.
// Returns a promise of the boolean result. True if successful, false if failed.
Db.addPeer = async function(peerToAdd){
    let peers = await Db.getAllPeers();
    peers.push(peerToAdd); // push the peer to the peers array
    return new Promise((resolve, reject) => {
        peersDb.put('peers', peers, function(err){
            if(err) resolve(false)
            resolve(true);
        });
    });
}

/***************************************/






/********** Shard DB Functions **********/

// Sublevel shards structure
// shards: {
//     *pollId*: [
//         {block},
//         {block},
//         {block},
//         {block},
//     ],
//     *pollId*: [
//         {block},
//         {block},
//         {block},
//         {block},
//     ],
//     *pollId*: [
//         {block},
//         {block},
//         {block},
//         {block},
//     ]
// }

// Returns a promise for the js object of all shard chains. Resolves to null if
// entry is not found and error is thrown.
Db.getAllShardChains = function(){
    return new Promise((resolve, reject) => {
        shardsDb.get('shards', function(err, shards){
            if(err){
                resolve(null);
            } else {
                return resolve(shards)
            }
        })
    });
}

// Returns a promise for the shard with the associated pollId. Resolves to null if
// entry is not found and error is thrown
Db.getShardChainById = function(pollId){
    return new Promise((resolve, reject) => {
        shardsDb.get('shards', function(err, shards){
            if(err){
                resolve(null);
            } else {
                return resolve(shards.pollId)
            }
        })
    });
}

// Returns a promise for the block at the specified height for the given pollId.
// If the shard chain is null or the index is undefined we return null.
Db.getShardBlockByHeight = async function(pollId, height){
    const shardChain = await Db.getShardChainById(pollId);
    if(shardChain == null || shardchain[height] == 'undefined'){
        return null;
    } else{
        return shardchain[height];
    }
}

// Replaces the whole shard chain for a specified pollId
// Returns a promise of the boolean result. True if successful, false if failed.
Db.replaceShardChain = async function(pollId, chainToSave){
    let shards = await Db.getAllShardChains();
    return new Promise((resolve, reject) => {
        if(shards == null || shards.pollId == null || shards.pollId == 'undefined'){
            resolve(false); // there are no shards or the pollId doesn't exist
        }
        shards.pollId = chainToSave; // update pollId
        shardsDb.put('shards', shards, function(err){
            if(err) resolve(false)
            resolve(true);
        });
    });
}

// Adds a given shard block to a pollId's blockchain. If successful resolves to true,
// on failure returns false
Db.addShardBlock = async function(pollId, blockToPush){
    let shards = await Db.getAllShardChains();
    return new Promise((resolve, reject) => {
        if(shards == null || shards.pollId == null || shards.pollId == 'undefined'){
            resolve(false); // there are no shards or the pollId doesn't exist
        }
        shards.pollId.push(blockToPush); // push the block we want added
        shardsDb.put('shards', shards, function(err){
            if(err) resolve(false);
            resolve(true);
        });
    });
}

// Sublevel shardsMempool structure
// mempools: {
//     *pollId*: [
//         {pollResponse},
//         {pollResponse},
//         {pollResponse},
//         {pollResponse}
//     ],
//     *pollId*: [
//         {pollResponse},
//         {pollResponse},
//         {pollResponse},
//         {pollResponse}
//     ],
//     *pollId*: [
//         {pollResponse},
//         {pollResponse},
//         {pollResponse},
//         {pollResponse}
//     ]
// }

// Return a promise for all shard mempools
Db.getAllShardMempools = async function(){
    return new Promise((resolve, reject) => {
        shardsMempoolDb.get('mempools', function(mempools){
            if(mempools == null || mempools.pollId == null || mempools.pollId == 'undefined'){
                resolve(null); // mempool is non-existent or the pollId doesn't exist
            } else {
                resolve(mempools);
            }
        });
    });
}

// Return a promise of the mempool for a given shard
Db.getShardMempool = async function(pollId){
    const mempools = await Db.getAllShardMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.pollId == null || mempools.pollId == 'undefined'){
            resolve(null); // mempool is non-existent or the pollId doesn't exist
        } else {
            resolve(mempools.pollId);
        }
    });
}

// Pushes an unconfirmed poll response onto the appropriate mempool given the response id
// Returns promise of the result. True on success, false on failure
Db.addShardMempoolResponse = async function(pollId, pollResponse){
    let mempools = await Db.getAllShardMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.pollId == null || mempools.pollId == 'undefined'){
            resolve(null); // mempool is non-existent or the pollId doesn't exist
        } else {
            mempool.pollId.push(pollResponse);
            shardsMempoolDb.put('mempool', mempools, function(err){
                if(err) resolve(false);
                resolve(true);
            });
        }
    });
}

/****************************************/








/********** Main DB Functions **********/

// Sublevel main structure
// main: [
//     {block},
//     {block},
//     {block},
//     {block},
//     {block}
// ]

// Return a promise for the value of the main blockchain array. Return null if not found.
Db.getMainChain = async function(){
    return new Promise((resolve, reject) => {
        mainDb.get('main', function(err, blockchain){
            if(err){
                resolve(null);
            } else {
                resolve(blockchain);
            }
        })
    });
}

// Return a promise for a block of height 'height' in the mainchain
// Return null if not found.
Db.getMainBlockByHeight = async function(height){
    const mainchain = await Db.getMainChain();
    return new Promise((resolve, reject) => {
        if(mainchain == null || mainchain[height] == null || mainchain[height] == 'undefined'){
            resolve(null); // either chain doesn't exist on peer or block doesn't exist
        } else {
            resolve(mainchain[height]);
        }
    });
}

// Replaces the main blockchain.
// Returns promise of the result. True on success, false on failure
Db.replaceMainChain = async function(chainToSave){
    let mainchain = await Db.getAllShardMempools();
    return new Promise((resolve, reject) => {
        if(mainchain == null){
            resolve(false);
        } else {
            mainDb.put('main', chainToSave, function(err){
                if(err) resolve(false);
                resolve(true);
            });
        }
    });
}

// Add a block to the main blockchain.
// Returns promise of the result. True on success, false on failure
Db.addMainBlock = async function(blockToPush){
    let mainchain = await Db.getAllShardMempools();
    return new Promise((resolve, reject) => {
        if(mainchain == null){
            resolve(false);
        } else {
            mainchain.push(blockToPush);
            mainDb.put('main', mainchain, function(err){
                if(err) resolve(false);
                resolve(true);
            });
        }
    });
}

// Sublevel mainMempool structure
// mempools: {
//     shardChains: [
//         {shardBlockChain},
//         {shardBlockChain},
//         {shardBlockChain},
//         {shardBlockChain}
//     ],
//     txns: [
//         {txn},
//         {txn},
//         {txn},
//         {txn}
//     ]
// }

// Return promise for both the txn and shardChain mempools.
// Returns null if nothing found.
Db.getMainMempools = async function(){
    return new Promise((resolve, reject) => {
        mainMempoolDb.get('mempools', function(err, mempools){
            if(err){
                resolve(null);
            } else {
                resolve(mempools);
            }
        })
    })
}

// Return promise for both the txn mempool
// Returns null if nothing found.
Db.getTxnMempool = async function(){
    const mempools = await Db.getMainMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.txns == null || mempools.txns == 'undefined'){
            resolve(null); // mempools either don't exist or txn mempool doesn't exist
        } else {
            resolve(mempools.txns);
        }
    });
}

// Return promise for both the shardChains mempool
// Returns null if nothing found.
Db.getShardChainMempool = async function(){
    const mempools = await Db.getMainMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.txns == null || mempools.txns == 'undefined'){
            resolve(null); // mempools either don't exist or txn mempool doesn't exist
        } else {
            resolve(mempools.shardChains);
        }
    });
}

Db.addMempoolShardChain = async function(shardChainToPush){
    let mempools = await Db.getMainMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.shardChains == null || mempools.shardChains == 'undefined'){
            resolve(null); // mempools or shardChain mempool doesn't exists
        } else {
            mempools.shardChains.push(shardChainToPush);
            mainMempoolDb.put('mempools', mempools, function(err){
                if(err) resolve(false);
                resolve(true);
            });
        }
    });
}

Db.addMempoolTxn = async function(txnToPush){
    let mempools = await Db.getMainMempools();
    return new Promise((resolve, reject) => {
        if(mempools == null || mempools.txns == null || mempools.txns == 'undefined'){
            resolve(null); // mempools or shardChain mempool doesn't exists
        } else {
            mempools.txns.push(txnToPush);
            mainMempoolDb.put('mempools', mempools, function(err){
                if(err) resolve(false);
                resolve(true);
            });
        }
    });
}

/****************************************/


module.exports = Db;
