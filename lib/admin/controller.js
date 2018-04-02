
/*
  Admin Controller
  (c) 2018 OpenPoll Inc
  ==============================================================================
  The admin controller is responsible for holding the logic that will run on request
  to administrative endpoints by the miner's Angular application. The miner interface
  is an Angular frontend Single Page Application (SPA) that provides miners access to
  the underlying functionality and elements of the mining app that will allow them to
  perform their mining tasks, monitor critical metrics, and manage their wallets. Endpoints
  will be prefaced by '/admin/' and be secured by a token in the request 'Authorization' header

  Every time that the Angular application wants to execute an action (interact with the miner's
  underlying mining application instance), they will pass the token along with the request.
  There will be middleware on every endpoint checking for this token and comparing it against
  what the mining application instance holds in LevelDb. An invalid token will lead to request
  rejection, while a valid token will grant access to the requested endpoint.
*/

// External Libraries
const chalk = require('chalk');

// Helpers
const cryptoHelpers = require('@openpoll/helpers').generic;
const dateHelpers = require('../util/dateHelpers');
const misc = require('../util/miscHelpers');

// Databases
const databases = require('../util/databases');

// The controller
let controller = {};

// Limit token checking
let tokenCheckCount = 0;
const TOKEN_CHECK_LIMIT = 7;

/* Checks if the provided adminAuth Token is valid */
controller.checkToken = function(req, res) {
    const tokenToCheck = req.body.token;

    if(tokenCheckCount <= TOKEN_CHECK_LIMIT){
        // A check will be executed. Increment tokenCheckCount.
        tokenCheckCount++;

        // Fetch token held in LevelDb
        databases.ShardMiner.get("adminAuthToken", function(err, adminAuthToken){
            if (err) return console.log('Problem fetching the adminAuthToken from the db.', err);
            
            // Compare token to what db holds
            if(tokenToCheck != adminAuthToken){
                // Auth token is incorrect.
                res.status(200);
                return res.json({
                    isValid: false
                });
            } else {
                // Token is correct
                res.status(200);
                return res.json({
                    isValid: true
                });
            }
        });
    }
}

/****************************************************************/
/*                  Shard Miner Admin Endpoints                 */
/****************************************************************/

/* This will return an array of general data on the shards that the miner is working on to
populate the initial home dashboard view with. */
controller.getShardsInfo = function(req, res) {
    let shardEntries = [];
    databases.Shards.createValueStream()
        .on('data', function (dataJSON) {
        // Parse
        const data = JSON.parse(dataJSON);

        // General shard info to be filled out w/ kv data chunk before being pushed into shardEntries array
        let shardInfo = {};

        // Populate general data to send to frontend
        shardInfo.id = data.pollHash; // id
        shardInfo.height = data.localChainLength; // height
        shardInfo.respPoolSize = data.localRespPoolSize; // respPoolSize
        shardInfo.lastUpdated = dateHelpers.epochToDateString(data.localLastUpdateTimestamp) // lastUpdated
        shardInfo.status = misc.randStatus(); // TODO: Do we store the status of Status for shards can be: "Active", "Paused", "Awaiting Responses", or "Failed". Currently placeholder;

        // Add to shard entries
        shardEntries.push(shardInfo);
      })
      .on('error', function (err) {
        console.log('There was an error streaming the Shards db:', err)
      })
      .on('end', function () {
        // No more data to stream. Stream has ended. Respond.
        res.status(200);
        return res.json({
            shardEntries
        });
      });
};

/* Starts or Pauses the shard with the provided shard ID. */
controller.toggleShardState = function(req, res) {
    const shardId = req.params.shardId;
    const action = req.query.action;
    if(action == 'start'){
        // TODO: Start the shard with id shardId after all associated prechecks & synching

        res.status(200);
        return res.json({
            message: `Started shard ${shardId}`
        });
    } else if ( action == 'pause'){
        // TODO: Pause the shard with id shardId

        res.status(200);
        return res.json({
            message: `Paused shard ${shardId}`
        });
    }
};

/* Deletes the specified shard from the miner's mining pool. Mining is shut down for the shard
and the db is wiped of any entries for the specified shard. The node's working status is potentially
broadcasted. */
controller.deleteShard = function(req, res) {
    const shardId = req.params.shardId;

    // TODO: Delete the shard with id shardId. Wipe corresponding dbs of any data for shardId.

    res.status(200);
    return res.json({
        message: "Deleted shard " + shardId
    });
};

/****************************************************************/
/*                End Shard Miner Admin Endpoints               */
/****************************************************************/






/****************************************************************/
/*                Mainchain Miner Admin Endpoints               */
/****************************************************************/

/* This will return an general data on the mainchain that the miner is working on to populate the
initial home dashboard with. */
controller.getMainchainInfo = function(req, res){

    // TODO: Pull general data for mainchain miner

    res.status(200);
    return res.json({
        mainchainEntry: {
			height: 15, // Height of the chain
			lastUpdated: '02-31-2018', // Date this chain was last synched with the network
			status: 'Paused'
	    }
    });
}

/* Starts or Pauses mining on the mainchain. */
controller.toggleMainchainState = function(req, res) {
    const action = req.query.action;
    if(action == 'start'){
        // TODO: Start mining on the mainchain after all associated prechecks & synching

        res.status(200);
        return res.json({
            message: 'Started mainchain mining.'
        });
    } else if ( action == 'pause'){
        // TODO: Pause mining on the mainchain

        res.status(200);
        return res.json({
            message: 'Paused mainchain mining.'
        });
    }
};

/* Clears the mining pool for the mainchain (both txns and completed shards). Mining is shutdown for the mainchain
and the db is wiped of entries for the mainchain. The node's working status is potentially broadcasted. */
controller.deleteMainchain = function(req, res) {
    // TODO: Delete the shard with id shardId. Wipe corresponding dbs of any data for shardId.

    res.status(200);
    return res.json({
        message: 'Deleted mainchain.'
    });
};

/****************************************************************/
/*              End Mainchain Miner Admin Endpoints             */
/****************************************************************/






/***************************************************************/
/*                 Miner Wallet Admin Endpoints                */      // TODO: Protect sensitive endpoints by asking for password on frontend and validating in endpoints
/***************************************************************/

/* This will return an array of general data on the wallets that
the miner holds to populate the wallet component view with. */
controller.getWalletsInfo = function(req, res) {
    // Fetch the wallets from the database
    databases.Wallets.get("wallets", function(err, walletsJson){
        // Parse JSON string of wallets array into array object
        const walletsArray = JSON.parse(walletsJson);

        // Create array for the general wallet info to be sent to the client
        const returnWallets = [];

        // For each wallet extract the information necessary to supply
        // frontend with
        walletsArray.forEach(function(wallet) {
            let returnWallet = {};
            returnWallet.id = wallet.id;
            returnWallet.address = wallet.address;

            // TODO: Must go out onto network to get wallet's balance or do we keep it
            // as a db value that is constantly updated? For now placeholder value.
            returnWallet.balance = 0;

            // Add the general information wallet to the wallets array that'll be returned
            returnWallets.push(returnWallet);
        });

        // Respond with general information on the wallets
        res.status(200);
        return res.json({
            wallets: returnWallets
        });
    });
};

/* Returns the private and public key pair for the wallet with the specified ID. */
controller.getWalletKeys = function(req, res) {
    const walletId = req.params.walletId;
    if(req.query.action == 'exportKeys'){
        // Get the wallets from db
        databases.Wallets.get("wallets", function(err, walletsJson){
            // Parse JSON string of wallets array into array object
            const walletsArray = JSON.parse(walletsJson);

            // Placeholder variable to hold matched wallet if found
            let walletMatch = null;

            // Linear search for wallet
            walletsArray.forEach(function(wallet) {
                if(wallet.id == walletId){
                    walletMatch = wallet;
                }
            });

            if(walletMatch){
                // Wallet with id found. Respond appropriately.
                res.status(200);
                return res.json({
                    walletId: walletId,
                    keys: {
                        publicKey: walletMatch.publicKey,
                        privateKey: walletMatch.privateKey
                    }
                });
            } else {
                // Wallet not found. This would never happen on a native request, but here just for consistency sake.
                res.status(404);
                return res.json({
                    message: `Wallet with id ${walletId} not found.`
                });
            }
        });
    }
};

/* Deletes the specified wallet from LevelDb and the keys associated with it.
Double user confirmation on the frontend will be implemented as this is a drastic action. */
controller.deleteWallet = function(req, res) {
    const walletId = req.params.walletId;

    // Get the wallets from db
    databases.Wallets.get("wallets", function(err, walletsJson){
        // Parse JSON string of wallets array into array object
        const walletsArray = JSON.parse(walletsJson);

        // Did deletion occur? boolean
        let isFoundAndDeleted = false;

        // Linear search and deletion if wallet is found
        walletsArray.forEach(function(wallet, index) {
            if (wallet.id == walletId) {
                walletsArray.splice(index, 1);
                isFoundAndDeleted = true;
            }
        });

        if(isFoundAndDeleted){
            // Wallet was found and was deleted
            // Resave update wallets
            databases.Wallets.put("wallets", JSON.stringify(walletsArray), function(err){
                // Respond appropriately
                res.status(200);
                return res.json({
                    walletId: walletId,
                    deletionStatus: 'complete'
                });
            });
        } else {
            // Wallet was not found and no deletion took place
            res.status(404);
            return res.json({
                message: `Wallet with id ${walletId} not found.`
            });
        }
    });
};

/* Exports the complete information of all of the miner's wallets. */
controller.exportWallets = function(req, res) {
    if(req.query.action == 'exportWallets'){
        databases.Wallets.get("wallets", function(err, walletsJson){
            // Parse JSON string of wallets array into array object
            const walletsArray = JSON.parse(walletsJson);

            // Respond
            res.status(200);
            return res.json({
                wallets: walletsArray
            });
        });
    }
};

/* Creates a wallet with one address and sends a response with general information on
this new wallet to populate the interface with. */
controller.addWallet = function(req, res) {
    const password = req.body.password;

    // New wallet to be populated and stored
    let newWallet = {};

    // Set id
    newWallet.id = cryptoHelpers.generateRandomId();

    // Set password hash
    const passwordHash = cryptoHelpers.hash(password, 'bcrypt');
    newWallet.passwordHash = passwordHash;

    // Set secret
    const secret = cryptoHelpers.generateSecret(passwordHash);
    newWallet.secret = secret;

    // Generate keypair and set keys
    const keyPair = cryptoHelpers.generateKeyPairFromSecret(secret);
    const publicKey = cryptoHelpers.getPublicFromKeypair(keyPair);
    const privateKey = ""; // TODO: Library doesn't support fetching private key. Go back and resolve later.
    newWallet.publicKey = publicKey;
    newWallet.privateKey = privateKey;

    // Generate & set address
    newWallet.address = cryptoHelpers.publicKeyToAddress(publicKey);

    // Get wallets db
    databases.Wallets.get("wallets", function(err, walletsJson){
        // Parse JSON string of wallets array into array object
        const walletsArray = JSON.parse(walletsJson);

        // Add new wallet
        walletsArray.push(newWallet);

        // Resave updated wallets array
        databases.Wallets.put("wallets", JSON.stringify(walletsArray), function(err){
            // Respond with general data about new wallet to frontend
            res.status(200);
            return res.json({
                wallet: {
                    id: newWallet.id, // The id of the new wallet
                    address: newWallet.address, // The one address on the new wallet
                    balance: 0 // Wallet balance in POL
                }
            });
        });
    });

};

/***************************************************************/
/****************** End Miner Wallet Endpoints *****************/
/***************************************************************/

module.exports = controller;
