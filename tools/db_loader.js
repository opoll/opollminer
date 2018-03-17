const level = require('level');
const fs = require('fs');
const R = require('ramda');

const databases = require('../lib/databases');

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