const databases = require('../lib/util/databases');

const pollIds = [ // aka poll hash...poll hash used to map in db
  "5F5FB96153BB67BCDFC0A95F8B98CF4E155AFD5D89A47E643E2509DC87ABCABF"
]

const shardBlockHashes = { // key is pollHash, value is the hashes of blocks in this shard in cardinal order
  "5F5FB96153BB67BCDFC0A95F8B98CF4E155AFD5D89A47E643E2509DC87ABCABF": [
    "46750073417EC82F7FC612B29519B9A3728025648A87EC89D4DFF1EE68DC907D",
    "FABF1DFF25D72BECA4BEC55AE6E7E7127E02A48B9BFA0199E64B480A46538E6B"
  ]
}

const randomPollId = pollIds[ Math.floor( Math.random() * pollIds.length ) ];

// Fetches a random wallet from the Wallets db
function getWalletsData(){
  databases.Wallets.get("wallets", function(err, walletJson){
    if (err) return console.log('Error loading WalltsDb!', err)
    const walletArray = JSON.parse(walletJson);

    console.log("\n");
    console.log("Wallets Db \n");
    console.dir(walletArray);
    console.log("\n");
  });
}

// Fetches a random poll/poll object from the Polls db
function getPollsData(){
  databases.Polls.get(randomPollId, function(err, pollDataJson){
    if (err) return console.log('Error loading PollsDb!', err)
    const pollData = JSON.parse(pollDataJson);

    console.log("\n");
    console.log(`Polls Db (Poll Id ${randomPollId} Fetched)\n`);
    console.dir(pollData);
    console.log("\n");
  });
}

// Fetches a random poll/poll object from the Shards db (uses same randomPollId as getPollsData() fetch)
function getShardsData(){
  databases.Shards.get(randomPollId, function(err, shardDataJson){
    if (err) return console.log('Error loading ShardsDb!', err)
    const shardData = JSON.parse(shardDataJson);

    console.log("\n");
    console.log(`Shards Db (Poll Id ${randomPollId} Fetched)\n`);
    console.dir(shardData);
    console.log("\n");
  });
}

// Fetches a random shard/block object from the ShardBlocks db (uses same randomPollId as getPollsData() fetch)
// then picks a random block hash to fetch the value for
function getShardBlocksData(){
  const hashes = shardBlockHashes[randomPollId]; // Get the block hashes for the random pollId/pollHash
  const randomBlockHash = hashes[ Math.floor( Math.random() * hashes.length ) ];
  databases.ShardBlocks.get(randomBlockHash, function(err, blockJson){
    if (err) return console.log('Error loading ShardBlocksDb!', err)
    const block = JSON.parse(blockJson);

    console.log("\n");
    console.log(`ShardBlocks Db (Random Block From Poll Id ${randomPollId})\n`);
    console.dir(block);
    console.log("\n");
  });
}

function getResponsePoolData(){
  databases.ResponsePool.get(randomPollId, function(err, poolJson){
    if (err) return console.log('Error loading ResponsePoolDb!', err)
    const pool = JSON.parse(poolJson);

    console.log("\n");
    console.log(`ResponsePool Db (Poll Id ${randomPollId})\n`);
    console.dir(pool);
    console.log("\n");
  });
}

function getNotificationsData(){
  databases.Notifications.get('notifications', function(err, notifsJson){
      if (err) return console.log('Error loading NotificationsDb!', err)
      const notifications = JSON.parse(notifsJson);

      console.log("\n");
      console.log(`Notifications Db \n`);
      console.dir(notifications);
      console.log("\n");
  });
}


// Call fetch functions
getWalletsData();
getPollsData();
getShardsData();
getShardBlocksData();
getResponsePoolData();
getNotificationsData()