const Db = require('../lib/util/db');

// Peer CRUD manual testing

// Db.addPeer('123.321.123.322').then(function(result){
//     console.log(result);
//     Db.getAllPeers().then(function(result){
//         console.log(result);
//     })
// })

// Db.removePeer('123.321.123.322').then(function(result){
//     console.log(result);
//     Db.getAllPeers().then(function(result){
//         console.log(result);
//     })
// })


// Shard CRUD manual testing

// const block = {
//     block: 'this is a block!'
// }
//
// const replacechain = [{block: 'replace chain!'}];

// Db.addShardBlock('1234sa2', 'block!').then(function(result){
//     console.log(result)
// });

// Db.replaceShardChain('1234sa2', ['chainreplaced!']).then(function(result){
//     console.log(result)
// });

// Db.addShardMempoolResponse('1234sa2', 'chainreplaced!').then(function(result){
//     console.log(result)
// });


// Main chain CRUD manual testing

// Db.addMainBlock(block).then(function(result){
//     console.log(result)
// });

// Db.replaceMainChain(replacechain).then(function(result){
//     console.log(result)
// });

// Db.getMainBlockByHeight(1).then(function(result){
//     console.log(result)
// });


// Main chain mempool CRUD manual testing

// Db.addMempoolTxn('txn').then(function(result){
//     console.log(result);
// })

// Db.getTxnMempool().then(function(result){
//     console.log(result);
// })

// Db.getMainMempools().then(function(result){
//     console.log(result);
// })

// Db.getShardChainMempool().then(function(result){
//     console.log(result);
// })

// Db.addMempoolShardChain('shardBlock').then(function(result){
//     console.log(result);
// })
