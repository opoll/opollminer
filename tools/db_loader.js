const level = require('level');
const fs = require('fs');
const R = require('ramda');

const databases = {
  ShardMiner: level( `./db/shard_miner` ), // General Key-Value store for miscellaneous data.   Maps: K -> V (miscellaneous storage)
  Wallets: level( `./db/wallets` ), // Storage for wallets by ID.                               Maps: walletId -> wallet/wallet (wallet storage)
  Polls: level( `./db/polls` ), // Storage for general information on a poll.                   Maps: pollHash -> /poll/poll (general poll info storage)
  Shards: level( `./db/shards` ), // Storage for general information on a shard.                Maps: pollHash -> /shard/shard (local shard mining data storage)
  ShardBlocks: level( `./db/shard_blocks` ), // Storage for shard blocks.                       Maps: blockHash -> /shard/block (shard block storage)
  ResponsePool: level( `./db/shard_pool` ), // Storage for shard's response pool                Maps: pollHash -> Array of /poll/response
};

const testJson = {
  Wallets: 'test/data/wallets.json'
};

function loadWallets(){
  // Load wallets json as js object
  const wallets = JSON.parse(fs.readFileSync(testJson.Wallets, 'utf8'));

  // Make function to run for each wallet indexed in wallets
  const storeWallet = function(value, key){
    // Load wallet
    databases.Wallets.put(key, JSON.stringify(value), function(err){
      if (err) return console.log(`Error loading wallet with id ${key}`, err);
      console.log(`Loaded wallet with id ${key}`)
    });
  }

  // Call function on each wallet in wallets
  R.forEachObjIndexed(storeWallet, wallets);
}

loadWallets();