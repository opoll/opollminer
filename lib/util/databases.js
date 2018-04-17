/*
  Databases
  -------------
  This database module keeps an active and open connection to
  all relevant database references due to the high and sporratic volume.
  No other libraries should conflict with these references.
  NOTE: these references are local to prevent direct access
*/

var level = require('level');

var tAutomatedInj = ( process.env.AUTOMATED_TESTING )?( 'automated_testing/' ):( '' );
var databases = {
  ShardMiner: level( `./db/${tAutomatedInj}shard_miner` ), // General Key-Value store for miscellaneous data.   Maps: K -> V (miscellaneous storage)
  Wallets: level( `./db/${tAutomatedInj}wallets` ), // Storage for wallets by ID.                               Maps: 'wallets' -> Array of wallet objects
  Notifications: level( `./db/${tAutomatedInj}notifications` ), // Notification storage                         Maps: 'notifications' -> Array of notification objects
  Polls: level( `./db/${tAutomatedInj}polls` ), // Storage for general information on a poll.                   Maps: pollHash -> /poll/poll (general poll info storage)
  Shards: level( `./db/${tAutomatedInj}shards` ), // Storage for general information on a shard.                Maps: pollHash -> /shard/shard (local shard mining data storage)
  ShardBlocks: level( `./db/${tAutomatedInj}shard_blocks` ), // Storage for shard blocks.                       Maps: blockHash -> /shard/block (shard block storage)
  ResponsePool: level( `./db/${tAutomatedInj}shard_pool` ) // Storage for shard's response pool                 Maps: pollHash -> Array of /poll/response (shard response pool storage)
};

module.exports = databases;