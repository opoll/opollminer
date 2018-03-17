const level = require('level');

const databases = {
  ShardMiner: level( `./db/shard_miner` ), // General Key-Value store for miscellaneous data.   Maps: K -> V (miscellaneous storage)
  Wallets: level( `./db/wallets` ), // Storage for wallets by ID.                               Maps: walletId -> wallet/wallet (wallet storage)
  Polls: level( `./db/polls` ), // Storage for general information on a poll.                   Maps: pollHash -> /poll/poll (general poll info storage)
  Shards: level( `./db/shards` ), // Storage for general information on a shard.                Maps: pollHash -> /shard/shard (local shard mining data storage)
  ShardBlocks: level( `./db/shard_blocks` ), // Storage for shard blocks.                       Maps: blockHash -> /shard/block (shard block storage)
  ResponsePool: level( `./db/shard_pool` ), // Storage for shard's response pool                Maps: pollHash -> Array of /poll/response
};

const walletIds = [
  "5780547968e7984936ef052b1629087ba0deebd36559dd94505cb0f0d04f3658",
  "13fb9f0d937312a6787e70161f1ee1e5f8e0d3c48cc8b030a5063849310d390e"
]

function getWallets(){
  const randomWalletId = walletIds[ Math.floor( Math.random() * walletIds.length ) ];
  databases.Wallets.get(randomWalletId, function(err, walletJson){
    if (err) return console.log('Error loading wallet!', err)
    const wallet = JSON.parse(walletJson);
    console.dir(wallet);
  });
}

getWallets();