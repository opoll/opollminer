const level = require('level');
const sublevel = require('level-sublevel');

const db = sublevel(level('./db', { valueEncoding: 'json' }));

// Note sublevels are not directories in structure. They are sublevels from the top level db.
const peersDb = db.sublevel('peers'); // /db/peers

const shardsDb = db.sublevel('shards'); // /db/shards
const shardsMempoolDb = db.sublevel('shardsMempool'); // /db/shardsMempool

const mainDb = db.sublevel('main'); // /db/main
const mainMempoolDb = db.sublevel('mainMempool'); // /db/mainMempool




/********** Peer DB Functions **********/

// Sublevel peers structure
// peers: [
//     '98.232.217.100',
//     '204.99.187.147',
//     '38.195.78.210',
//     '77.217.44.9',
//     '141.135.87.215'
// ]

async function getAllPeers(){
    const peerData = await peersDb.get('peers');
    return peerData.peers;
}

async function addPeer(peerToAdd){
    let peerData = await peersDb.get('peers');
    peerData.push(peerToAdd);
    await peerData.put('peers', peerData);
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

async function getShardChainById(pollId){
    const shards = await shardsDb.get('shards');
    return shards.pollId;
}

async function getShardBlockByHeight(pollId, height){
    const shardchain = await getShardChainById(pollId);
    return shardchain[height];
}

async function replaceShardChain(pollId, chainToSave){
    let shards = await shardsDb.get('shards');
    shards.pollId = chainToSave;
    await shardsDb.put('shards', shards);
}

async function addShardBlock(pollId, blockToPush){
    let shards = await shardsDb.get('shards');
    shards.pollId.push(blockToPush);
    await shardsDb.put('shards', shards);
}

// Sublevel shardsMempool structure
// mempool: [
//     {pollResponse},
//     {pollResponse},
//     {pollResponse},
//     {pollResponse}
// ]

async function addMempoolResponse(pollResponse){
    let mempool = await shardsMempoolDb.get('mempool');
    mempool.push(pollResponse);
    await shardsMempoolDb.put('mempool', mempool);
}

async function getShardMempool(pollId){
    const mempool = await shardsMempoolDb.get('mempool');
    return mempool;
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

async function getMainChain(){
    const main = await mainDb.get('main');
    return main;
}

async function getMainBlockByHeight(height){
    const main = await getMainChain();
    return main[height];
}

async function replaceMainChain(chainToSave){
    let main = await getMainChain();
    main = chainToSave;
    await mainDb.put('main', main);
}

async function addMainBlock(blockToPush){
    let main = await getMainChain();
    main.push(blockToPush);
    await mainDb.put('main', main);
}

// Sublevel mainMempool structure
// mempool: {
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

async function addMempoolShardChain(shardChainToPush){
    const mempool = await mainMempoolDb.get('mempool');
    mempool.shardChains.push(shardChainToPush);
    await mainMempoolDb.put('mempool', mempool);
}

async function addMempoolTxn(txnToPush){
    const mempool = await mainMempoolDb.get('mempool');
    mempool.txns.push(txnToPush);
    await mainMempoolDb.put('mempool', mempool);
}

async function getTxnMempool(){
    const mempool = await mainMempoolDb.get('mempool');
    return mempool.txns;
}

async function getShardChainMempool(){
    const mempool = await mainMempoolDb.get('mempool');
    return mempool.shardChains;
}

/****************************************/


module.exports = Db;
