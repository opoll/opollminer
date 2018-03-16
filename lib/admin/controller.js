
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

  Every time that the Angular application want's to execute an action (interact with the miner's
  underlying mining application instance), they will pass the token along with the request.
  There will be middleware on every endpoint checking for this token and comparing it against
  what the mining application instance holds in LevelDb. An invalid token will lead to request
  rejection, while a valid token will grant access to the requested endpoint.
*/

// External Libraries
const http = require('http');
const level = require('level');

// The controller
let controller = {};

// Admin Info Served boolean
let adminInfoServed = false;

/* Serves the Angular interface the adminAuthToken and nodeType immediately on the application's
instantiation and then shuts down this endpoint for the life of the application instance.*/
controller.serveAdminInfo = function(req, res) {
    if(!adminInfoServed){
        
        res.status(200);
        adminInfoServed = true; // Shutdown endpoint

        // Both nodeType and adminAuthToken would be fetched from the LevelDb
        return res.json({
            adminAuthToken: 'NjhiNDY4NjA0ZTY3NWUxMWU3YWIzYzA5YzU1YmQyNDdiNjNiMTk2ZmQ3Yzg5ODNhYTM3NWY1ZmM0MzI1M2MzMTsxNy44LjI0My4xNDA7OTAxMQ==',
            nodeType: 'shard'
        });
    }
}

/****************************************************************/
/*                  Shard Miner Admin Endpoints                 */
/****************************************************************/

/* This will return an array of general data on the shards that the miner is working on to
populate the initial home dashboard view with. */
controller.getShardsInfo = function(req, res) {
    res.status(200);
    return res.json({
        shardEntries: [
            {
              id: '0x74324d303857b5779bca422f211b6d75',
              height: 14,
              respPoolSize: 0,
              lastUpdated: '02-24-2018',
              status: 'Awaiting Responses'
            },
            {
              id: '0x3871612dc2bf2add6de545b950701933',
              height: 24,
              respPoolSize: 32,
              lastUpdated: '03-01-2018',
              status: 'Active'
            },
            {
              id: '0xf8324e74713c0d65a2a025d9a744b58f',
              height: 14,
              respPoolSize: 12,
              lastUpdated: '03-23-2018',
              status: 'Failed'
            },
            {
              id: '0x489c3f18c6c4de7b799c3cc000d3d670',
              height: 21,
              respPoolSize: 9,
              lastUpdated: '04-24-2018',
              status: 'Paused'
            },
            {
              id: '0xbb155c1642c33ec1358cb23f7ea312a7',
              height: 40,
              respPoolSize: 94,
              lastUpdated: '02-02-2018',
              status: 'Active'
            },
            {
              id: '0x0990f688ae97f026d2aacf1f6caacc97',
              height: 49,
              respPoolSize: 53,
              lastUpdated: '02-21-2018',
              status: 'Active'
            },
            {
              id: '0x1e176a44ebb3be6a21f68a0de9d17d8c',
              height: 33,
              respPoolSize: 0,
              lastUpdated: '02-29-2018',
              status: 'Awaiting Responses'
            },
            {
              id: '0xfb308a4a53707fa4da4e694466d88888',
              height: 8,
              respPoolSize: 74,
              lastUpdated: '02-21-2018',
              status: 'Failed'
            }
        ]
    });
};

/* Starts or Pauses the shard with the provided shard ID. */
controller.toggleShardState = function(req, res) {
    const shardId = req.params.shardId;
    const action = req.query.action;
    if(action == 'start'){
        // Start the shard with id shardId

        res.status(200);
        return res.json({
            message: `Started shard ${shardId}`
        });
    } else if ( action == 'pause'){
        // Pause the shard with id shardId

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
        // Start mining on the mainchain after appropriate
        // state changes

        res.status(200);
        return res.json({
            message: 'Started mainchain mining.'
        });
    } else if ( action == 'pause'){
        // Pause mining on the mainchain

        res.status(200);
        return res.json({
            message: 'Paused mainchain mining.'
        });
    }    
};

/* Clears the mining pool for the mainchain (both txns and completed shards). Mining is shutdown for the mainchain
and the db is wiped of entries for the mainchain. The node's working status is potentially broadcasted. */
controller.deleteMainchain = function(req, res) {
    res.status(200);
    return res.json({
        message: 'Deleted mainchain.'
    });
};

/****************************************************************/
/*              End Mainchain Miner Admin Endpoints             */
/****************************************************************/






/***************************************************************/
/*                 Miner Wallet Admin Endpoints                */
/***************************************************************/

/* This will return an array of general data on the wallets that
the miner holds to populate the wallet component view with. */
controller.getWalletsInfo = function(req, res) {
    res.status(200);
    return res.json({
        wallets: [
            {
              id: 'a6ffed9-4252-427e-af7d-3dcaaf2db2df',
              address: 'mwVb4SJUxAoKmj3B1eQmxoEHJXY7v8izPk',
              balance: 265
            },
            {
              id: 'da492b1-c744-9bbe-d10e-cd871a65fac',
              address: 'e293e42b3bd765fad06c1ae258ca1405',
              balance: 930
            },
            {
              id: 'e81bcf8-02d6-afea-1006-f9f02b76f',
              address: '9edc1d079f29a6e42f8edf18d56876fe',
              balance: 0
            }
          ]
    });
};

/* Returns the private and public key pair for the wallet with the specified ID. */
controller.getWalletKeys = function(req, res) {
    const walletId = req.params.walletId;
    if(req.query.action == 'exportKeys'){
        res.status(200);
        return res.json({
            walletId: walletId,
            publicKey: '0341383d6c51be12ca6742e061a9c30e71133a93ec3a29f1464c0a11a00da62b4e',
            privateKey: 'cb6b55e4fcef4ea8ff9b3a5514308b7796ae3880a59b1e7744da2012d537cd50'
        });
    }
};

/* Deletes the specified wallet from LevelDb and the keys associated with it.
Double user confirmation on the frontend will be implemented as this is a drastic action. */
controller.deleteWallet = function(req, res) {
    const walletId = req.params.walletId;
    res.status(200);
    return res.json({
        walletId: walletId,
        deletionStatus: 'complete'
    });
};

/* Exports the complete information of all of the miner's wallets. */
controller.exportWallets = function(req, res) {
    if(req.query.action == 'exportWallets'){
        res.status(200);
        return res.json({
            wallets: [
                {
                  id: 'a6ffed9-4252-427e-af7d-3dcaaf2db2df',
                  address: 'mwVb4SJUxAoKmj3B1eQmxoEHJXY7v8izPk',
                  keys: {
                      publicKey: '02a46197deb8ec6275a927d7a2449361b367f055afe28e8d903e61aff590f96cc5',
                      privateKey: 'fd5ca38ee6993640e288a678b1f14f2a27a2ef6178be87176c18e7c236181cc4'
                  },
                  balance: 265
                },
                {
                  id: 'da492b1-c744-9bbe-d10e-cd871a65fac',
                  address: 'e293e42b3bd765fad06c1ae258ca1405',
                  keys: {
                    publicKey: '023d52321f9404f2ecc516dda039cbf5b75695dbde9b9968398909d8785b72cf69',
                    privateKey: '37a5dfd407a6cd69620905cdf4d7b9a622c393bafe52ff4244854eb1d25d8757'
                  },
                  balance: 930
                },
                {
                  id: 'e81bcf8-02d6-afea-1006-f9f02b76f',
                  address: '9edc1d079f29a6e42f8edf18d56876fe',
                  keys: {
                    publicKey: '023d52321f9404f2ecc516dda039cbf5b75695dbde9b9968398909d8785b72cf69',
                    privateKey: '37a5dfd407a6cd69620905cdf4d7b9a622c393bafe52ff4244854eb1d25d8757'
                  },
                  balance: 0
                }
              ]
        });
    }
};

/* Creates a wallet with one address and sends a response with general information on
this new wallet to populate the interface with. */
controller.addWallet = function(req, res) {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    res.status(200);
    return res.json({
        wallet: {
			id: 'e81bcf8-02d6-afea-1006-f9f02b76f', // The id of the new wallet
			address: 'mwVb4SJUxAoKmj3B1eQmxoEHJXY7v8izPk', // The one address on the new wallet
			balance: 0 // Wallet balance in POL
	    }
    });
};

/***************************************************************/
/****************** End Miner Wallet Endpoints *****************/
/***************************************************************/

module.exports = controller;