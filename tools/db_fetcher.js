const level = require('level');

const databases = require('../lib/util/databases');

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