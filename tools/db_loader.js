const level = require('level');
const fs = require('fs');
const R = require('ramda');

const databases = require('../lib/util/databases');

const testJson = {
  Wallets: 'test/data/wallets.json',
  Polls: 'test/data/polls.json',
  Shards: 'test/data/shards.json',
  ShardBlocks: 'test/data/shardBlocks.json',
  ResponsePool: 'test/data/responsePool.json',
  Notifications: 'test/data/notifications.json'
};

// Load 'Wallets' database with dummy data
function loadWalletsDb(){
  // Load wallets json as js object
  const walletsObject = JSON.parse(fs.readFileSync(testJson.Wallets, 'utf8'));

  // Store wallets array
  databases.Wallets.put("wallets", JSON.stringify(walletsObject.wallets), function(err){
    if (err) return console.log(`Error loading wallets`, err);
    console.log(`Loaded wallets`)
  });
}

// Load 'Polls' database with dummy data
function loadPollsDb(){
  // Load polls data json as js object
  const pollsData = JSON.parse(fs.readFileSync(testJson.Polls, 'utf8'));

  const storePollsData = function(value, key){
    // Load polls data
    databases.Polls.put(key, JSON.stringify(value), function(err){
      if (err) return console.log(`Error loading general data for poll with id ${key}`, err);
      console.log(`Loaded general data for poll with id ${key}`);
    });
  }

  // Call function on each item
  R.forEachObjIndexed(storePollsData, pollsData);
}

// Load 'Shards' database with dummy data
function loadShardsDb(){
  // Load shards data json as js object
  const shardsData = JSON.parse(fs.readFileSync(testJson.Shards, 'utf8'));

  const storeShardsData = function(value, key){
    // Load shards data
    databases.Shards.put(key, JSON.stringify(value), function(err){
      if (err) return console.log(`Error loading general data for shard with id ${key}`, err);
      console.log(`Loaded general shard data for poll with id ${key}`);
    });
  }

  // Call function on each item
  R.forEachObjIndexed(storeShardsData, shardsData);
}


// Load 'ShardBlocks' database with dummy data
function loadShardBlocksDb(){
  // Load shards block data json as js object
  const shardBlocksData = JSON.parse(fs.readFileSync(testJson.ShardBlocks, 'utf8'));

  const storeShardBlocksData = function(value, key){
    // Load shard blocks
    databases.ShardBlocks.put(key, JSON.stringify(value), function(err){
      if (err) return console.log(`Error loading shard block with hash ${key}`, err);
      console.log(`Loaded shard block with id ${key}`);
    });
  }

  // Call function on each item
  R.forEachObjIndexed(storeShardBlocksData, shardBlocksData);
}


// Load 'ResponsePool' database with dummy data
function loadResponsePoolDb(){
  // Load pool data json as js object
  const poolData = JSON.parse(fs.readFileSync(testJson.ResponsePool, 'utf8'));

  const storePoolData = function(value, key){
    // Load pool
    databases.ResponsePool.put(key, JSON.stringify(value), function(err){
      if (err) return console.log(`Error loading response pool for poll w/ hash ${key}`, err);
      console.log(`Loaded response poll for poll w/ hash ${key}`);
    });
  }

  // Call function on each item
  R.forEachObjIndexed(storePoolData, poolData);
}

// Load 'Notifications' db
function loadNotifications(){
    // Load pool data json as js object
    const notifications = JSON.parse(fs.readFileSync(testJson.Notifications, 'utf8'));

    // Insert the array into leveldb with key 'notifications'
    databases.Notifications.put("notifications", JSON.stringify(notifications), function(err){
        if (err) return console.log(`Error loading notifications into db`, err);
        console.log(`Loaded notifications`)
    });
}


// Call load functions
loadWalletsDb();
loadPollsDb();
loadShardsDb();
loadShardBlocksDb();
loadResponsePoolDb();
loadNotifications();