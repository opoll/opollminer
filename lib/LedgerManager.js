/*
    Ledger Manager
*/

var hook = require("./hook");
var fs = require('fs-extra');
var level = require("level");
var BlockManagerBase = require("./BlockManager")();

// Test genesis wallet
var GenesisWallet = {
    "OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL": 10000,
};

var ledger = {};

module.exports = ledger;

// Hook when a block gets validated, 
// the only way a block is validated is if we can build the entire chain back to the genesis.
hook.Add("blockValidated", "createBlockLedger", async function(block){
    if (block.pollhash){ return; }

    // Update the ledgers based on transactions

    var utxoData = {};

    for (var transHash in block.transactions){
        var transaction = block.transactions[transhash];
        // fee is 1%
        var fee = 0.01 * transaction.amount;
        var payment = transaction.amount - fee;
        // Take the POLU from sender
        await ledger.addAmount(block.hash, transaction.senderAddress, -transaction.amount);
        // Give POLU - fee to receiver
        await ledger.addAmount(block.hash, transaction.receiverAddress, payment);
        // Add transaction to ledger
        await ledger.addTransaction(block.hash, block.hash, transHash);
        
        /*
            TODO: Apply miner payment
            await ledger.addAmount(block.hash, block.minerAddress, fee);
            utxo[block.minerAddress] = (utxo[block.minerAddress] || 0) + fee;
            
        */

        // Apply the UTXO change
        utxoData[transaction.senderAddress] = (utxoData[transaction.senderAddress] || 0) - transaction.amount;
        utxoData[transaction.receiverAddress] = (utxoData[transaction.receiverAddress] || 0) + payment;
        
    }

    var utxo = await ledger.blockhashToUTXO(block.hash);
    await utxo.open();
    await utxo.put("data", utxoData);
    await utxo.close();
});

/*
ledger.getUTXO = function(blockhash, address){

}
// Update UTXO ledger 
ledger.addUTXO = function(blockhash, address, amount){
    return new Promise(function(resolve){
      
    });
}*/

// UTXO Ledger
ledger.blockhashToUTXO = async function(blockhash){
    var block = await BlockManagerBase.GetBlockByHash(blockhash);
    // Check if the blockhash provided returns a validated block
    if (!block){
        console.log("INVALID BLOCKHASH PROVIDED");
        return false;
    }

    var hashDB = `./db/ledgers/${blockhash}_utxo`;

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

    // Genesis ledger
    if (block.blockId == 1){
        var ledgerDB = level(hashDB);
        if (!block.pollhash){
            for (var address in GenesisWallet){
               await ledgerDB.put(address, GenesisWallet[address]);
            }
        }
        await ledgerDB.close();
        return ledgerDB;
    }

    // Check if we already created the ledger
    if (!fs.pathExistsSync(hashDB)){
        // Copy the previous ledger
        
        var previousLedger = await ledger.blockhashToAccountLedger(block.prevHash);
        fs.copySync(`./db/ledgers/${block.prevHash}`,hashDB)
    }
    var ledgerDB = level(hashDB);
    await ledgerDB.close();
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
        if (!block.pollhash){
            for (var address in GenesisWallet){
               await ledgerDB.put(address, GenesisWallet[address]);
            }
        }
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
    var total = await ledger.getAmount(blockhash, address);
    await ledger.setAmount(blockhash, address, parseInt(parseInt(total) + parseInt(amount)));
}

// Check if a transaction hash is already in use by a blockhash
ledger.usedTransaction = function(blockhash, transhash){
    return new Promise(async function(resolve){
        // Get the ledger for specified blockhash
        var myledger = await ledger.blockhashToTransactionLedger(blockhash);
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
        var myledger = await ledger.blockhashToTransactionLedger(blockhash);
        await myledger.open();
        await myledger.put(transhash, true);
        await myledger.close();
        resolve(true);
    });
}

async function test(){
    var amount = await ledger.getAmount("000007f56852718926f319377df06eeaeafa6e7487062f95fe9228d319b88916", "OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL");
    console.log("Account OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL has: " + amount);

    await ledger.addAmount("000007f56852718926f319377df06eeaeafa6e7487062f95fe9228d319b88916", "OPEN126dbcLy5hvyYPXfie1DuC5myHdXLZun2UVM3BauPOLL", 10);
}
//test();