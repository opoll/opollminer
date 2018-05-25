/*
    Ledger Manager
*/

if (global.LedgerManager ){
    module.exports = global.LedgerManager;
    return;
}

var hook = require("./hook");
var fs = require('fs-extra');
var level = require("level");

var BlockManagerBase = require("./BlockManager")();

// Test genesis wallet
var GenesisWallet = {
    "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL": 10000000000,
};

var ledger = {};

module.exports = ledger;

var UTXODB = level("./db/ledgers/utxo");
var ShardPool = level("./db/shardpool");

// Hook when a block gets validated, 
// the only way a block is validated is if we can build the entire chain back to the genesis.
hook.Add("blockValidated", "createBlockLedger", async function(block){
    
    if (block.pollhash){ return; }

    // Update the ledgers based on transactions
    var utxoData = {
        block: block.blockId,
        balances: {},
    };

    // A map of UTXO address changes
    var ChangedAddresses = {};

    /*
        Update the ledger based off transactions contained within this block
    */
    for (var transhash in block.transactions) {
        // Get the transaction
        var transaction = block.transactions[transhash];

        // Calculate the miner fee
        var fee = Math.floor(0.01 * transaction.amount);
        var payment = Math.floor(transaction.amount - fee);
       
        // Take the POLU from sender
        await ledger.addAmount(block.hash, transaction.senderAddress, -transaction.amount);

        // Give POLU - fee to receiver
        await ledger.addAmount(block.hash, transaction.receiverAddress, payment);

        // Add transaction to ledger
        await ledger.addTransaction(block.hash, transhash);

        // Add the fee to the miner
        await ledger.addAmount(block.hash, block.minerAddress, fee);
   
        // Record associated UTXO Changes
        ChangedAddresses[transaction.senderAddress] = true;
        ChangedAddresses[transaction.receiverAddress] = true;
        ChangedAddresses[block.minerAddress] = true;
        await console.log(transaction.senderAddress,transaction.receiverAddress, payment);
        /*
        // Apply the UTXO change
        utxoData.balances[transaction.senderAddress] = await ledger.getAmount(block.hash, transaction.senderAddress);
        utxoData.balances[transaction.receiverAddress] = await ledger.getAmount(block.hash, transaction.receiverAddress);

        utxoData.balances[block.minerAddress] = await ledger.getAmount(block.hash, block.minerAddress);
        */
        
    }

    // Process all shards contained in this block
    for (var pollHash in block.shards) {
        // Get the shard and associated ledger
        var shardData = block.shards[pollHash];
        var shardLedger = await ledger.blockhashToShardLedger(block.hash);

        // Mark this poll as having been processed in this chain
        await shardLedger.open();
        await shardLedger.put(pollHash, true);
        await shardLedger.close();

        // Pay the miners who mined blocks
        for (var address in shardData.minerRewardAddresses) {
            // Get the amount we are rewarding this miner
            var amount = shardData.minerRewardAddresses[address];

            // Pay this miner
            await ledger.addAmount(block.hash, address, amount);

            // Record UTXO Change
            ChangedAddresses[address] = true;
        }

        // Pay the respondents
        for (var address in shardData.respondentRewardAddresses) {
            // Get the amount we are paying this respondent address
            var amount = shardData.respondentRewardAddresses[address];

            // Pay this respondent address
            await ledger.addAmount(block.hash, address, amount);

            // Record UTXO Change
            ChangedAddresses[address] = true;
        }
    }

    // Update UTXO
    for (var address in ChangedAddresses) {
        utxoData.balances[address] = await ledger.getAmount(block.hash, address);
    }

    // Store in UTXO db
    await UTXODB.put(block.hash, JSON.stringify(utxoData));

    hook.Call("utxoGenerated", {block: block, utxo:utxoData});
});

// API UTXO digest request
ledger.getUTXODigest = function(blockhash){
    return new Promise(function(resolve){
        UTXODB.get(blockhash, function(err, val){
            if (err){
                resolve({error: "No UTXO"});
            }else{
                resolve(JSON.parse(val));
            }
        });
    });
}

/*
ledger.getUTXO = function(blockhash, address){

}
// Update UTXO ledger 
ledger.addUTXO = function(blockhash, address, amount){
    return new Promise(function(resolve){
      
    });
}

// UTXO Ledger
ledger.blockhashToUTXO = async function(blockhash){
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block
    if (!block){
        console.log("INVALID BLOCKHASH PROVIDED");
        return false;
    }

    var hashDB = `./db/ledgers/utxo`;

    var ledgerDB = level(hashDB);
    await ledgerDB.close();
    return ledgerDB;

}
*/
function Wait( time){
    return new Promise(function(resolve){
        var intv = setInterval(function(){
            clearInterval(intv);
            resolve();
        }, time)
    })
}
// Count entries in a ledger
ledger.countKeys = function(ledger){
    return new Promise(function(resolve){
        var count = 0;
        ledger.createKeyStream().on('data', function (data){
            count++;
        }).on('end',function(){
            resolve(count);
        });
    });
}

var LedgerStorage = {};
// Any ledger specified
ledger.blockhashToLedger = async function(blockhash, ledgername){
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block

    var hashDB = `./db/ledgers/${blockhash}_${ledgername}`;
    
    if (LedgerStorage[hashDB]){
        while (LedgerStorage[hashDB].isOpen()){
            console.log("ledger is still open, waiting ", hashDB);
            await Wait(2000);
            
        }
        var ledgerDB = level(hashDB);
        LedgerStorage[hashDB] = ledgerDB;
        
        //await LedgerStorage[hashDB].close();
        return ledgerDB;
    }
    // Blank ledger
    if (!block || block.blockId == 1){
        var ledgerDB = level(hashDB);
        //await ledgerDB.close();
        LedgerStorage[hashDB] = ledgerDB;
        return ledgerDB;
    }
   
    // Check if we already created the ledger
    if (!fs.pathExistsSync(hashDB)){
        // Copy the previous ledger
        
        var previousLedger = await ledger.blockhashToLedger(block.prevHash, ledgername);
        await previousLedger.close();
        fs.copySync(`./db/ledgers/${block.prevHash}_${ledgername}`,hashDB)
    }
    var ledgerDB = level(hashDB);
    //await ledgerDB.close();
    LedgerStorage[hashDB] = ledgerDB;
    return ledgerDB;
}

// Shard Ledger
ledger.blockhashToShardLedger = async function(blockhash){
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block
    if (!block){
        console.log("INVALID BLOCKHASH PROVIDED");
        return false;
    }

    var hashDB = `./db/ledgers/${blockhash}_shards`;

    // Genesis ledger
    if (block.blockId == 1){
        var ledgerDB = level(hashDB);
        await ledgerDB.close();
        return ledgerDB;
    }

    // Check if we already created the ledger
    if (!fs.pathExistsSync(hashDB)){
        // Copy the previous ledger
        
        var previousLedger = await ledger.blockhashToShardLedger(block.prevHash);
        fs.copySync(`./db/ledgers/${block.prevHash}_shards`,hashDB)
    }
    var ledgerDB = level(hashDB);
    await ledgerDB.close();
    return ledgerDB;
}

// Ledger for account information
ledger.blockhashToAccountLedger = async function (blockhash) {
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block
    if (!block){
        console.log("INVALID BLOCKHASH PROVIDED");
        return false;
    }

    var hashDB = `./db/ledgers/${blockhash}`;

    if (LedgerStorage[hashDB]){
        while (LedgerStorage[hashDB].isOpen()){
            console.log("ledger is still open, waiting ", hashDB);
            await Wait(2000);
            
        }
        var ledgerDB = level(hashDB);
        LedgerStorage[hashDB] = ledgerDB;
        
        //await LedgerStorage[hashDB].close();
        return ledgerDB;
    }

    // Genesis ledger
    if (block.blockId == 1){
        var ledgerDB = level(hashDB);
        if (!block.pollhash){
            for (var address in GenesisWallet){
               await ledgerDB.put(address, GenesisWallet[address]);
            }
        }
        LedgerStorage[hashDB] = ledgerDB;
        return ledgerDB;
    }

    // Check if we already created the ledger
    if (!fs.pathExistsSync(hashDB)){
        // Copy the previous ledger
        
        var previousLedger = await ledger.blockhashToAccountLedger(block.prevHash);
        await previousLedger.close();
        fs.copySync(`./db/ledgers/${block.prevHash}`,hashDB)
    }
    var ledgerDB = level(hashDB);

    LedgerStorage[hashDB] = ledgerDB;

    return ledgerDB;
}

// Ledger for transactions
ledger.blockhashToTransactionLedger = async function (blockhash) {
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block
    if (!block){
        console.log("INVALID BLOCKHASH PROVIDED");
        return false;
    }

    var hashDB = `./db/ledgers/${blockhash}_transactions`;
    
    // Genesis ledger
    if (block.blockId == 1){
        var ledgerDB = level(hashDB);
        await ledgerDB.close();
        return ledgerDB;
    }

    // Check if we already created the ledger
    if (!fs.pathExistsSync(hashDB)){
        // Copy the previous ledger
        var previousLedger = await ledger.blockhashToTransactionLedger(block.prevHash);
        fs.copySync(`./db/ledgers/${block.prevHash}_transactions`,hashDB)
    }
    var ledgerDB = level(hashDB);
    await ledgerDB.close();
    return ledgerDB;
}

// Get POLU amount for address from blockhash specified
ledger.getAmount = function(blockhash, address){
    return new Promise(async function(resolve){
        // Grab the ledger for block
        var myledger = await ledger.blockhashToAccountLedger(blockhash);
        await myledger.open();
        myledger.get(address, async function(err, value){
            await myledger.close();
            // If theres an error return 0
            if (err){
                resolve(0);
                return;
            }
            resolve(value);
            return;
        });
    })
}

// Set POLU amount for address from blockhash specified
ledger.setAmount = function(blockhash, address, amount){
    return new Promise(async function(resolve){
        var myledger = await ledger.blockhashToAccountLedger(blockhash);
        await myledger.open();
        await myledger.put(address, amount);
        await myledger.close();
        resolve(true);
    });
}

// Add specified amount of POLU for an address
ledger.addAmount = async function(blockhash, address, amount){
    await console.log(address, amount);
    var total = await ledger.getAmount(blockhash, address);
    await ledger.setAmount(blockhash, address, parseInt(parseInt(total) + parseInt(amount)));
    await console.log("finish", address, amount);
}

// Check if a transaction hash is already in use by a blockhash
ledger.usedTransaction = function(blockhash, transhash){
    return new Promise(async function(resolve){
        // Get the ledger for specified blockhash
        var myledger = await ledger.blockhashToLedger(blockhash, "transactions");
        await myledger.open();
        myledger.get(transhash, async function(err, value){
            await myledger.close();

            // error means it was not found in the database
            if (err){
                resolve(false);
            }else{
                resolve(true);
            }
            return;
        });
    });
}

// Add a transaction hash to a block ledger
ledger.addTransaction = function(blockhash, transhash){
    return new Promise(async function(resolve){
        // Get the ledger for specified blockhash
        var myledger = await ledger.blockhashToLedger(blockhash, "transactions");
        await myledger.open();
        await myledger.put(transhash, true);
        await myledger.close();
        resolve(true);
    });
}

async function test(){
    /*
    await ledger.addAmount("00000800d9ca888856d2bb8bd36ed850636a1e58d65f43e56433b5f19d0c52db", "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL", -100)
    await ledger.addAmount("00000800d9ca888856d2bb8bd36ed850636a1e58d65f43e56433b5f19d0c52db", "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL", -100)
    await ledger.addAmount("00000800d9ca888856d2bb8bd36ed850636a1e58d65f43e56433b5f19d0c52db", "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL", -100)
    await ledger.addAmount("00000800d9ca888856d2bb8bd36ed850636a1e58d65f43e56433b5f19d0c52db", "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL", -100)

    var amount = await ledger.getAmount("00000800d9ca888856d2bb8bd36ed850636a1e58d65f43e56433b5f19d0c52db", "OPEN12V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL");
    console.log("Account OPEN22V1bnRoASzNB9CJNVHQ89LeeUygA4ib3AkL1aPePOLL has: " + amount);
    */
    //await ledger.addAmount("000007f56852718926f319377df06eeaeafa6e7487062f95fe9228d319b88916", "OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL", 10);
}

// Get all entries of the shard pool
ledger.getEntireShardPool = function(){
    return new Promise(function(resolve){
        var pool = {};
        ShardPool.createReadStream()
        .on('data', function (data) {
            pool[data.key] = data.value;
        }).on('close', function(){
            resolve(pool);
        });
    });
}
// Get list of possible chains for a specific poll shard
ledger.getShardPool = function(pollHash){
    return new Promise(function(resolve){
        ShardPool.get(pollHash, function(err, val){
            if (!err){
                try {
                    resolve(JSON.parse(val));
                    return;
                }catch(err){
                    resolve({});
                    return;
                }
            }
            resolve({});
        });
    });
}

// Add chain to specific poll shard (in the event of multiple people completing a shard?)
ledger.UpdateShardPool = async function(pollHash, blockHash){
    var pool = await ledger.getShardPool(pollHash);
    pool[blockHash] = true;
    await ShardPool.put(pollHash, JSON.stringify(pool));
}