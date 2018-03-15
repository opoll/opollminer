
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


/****************************************************************/
/*                  Shard Miner Admin Endpoints                 */
/****************************************************************/



/****************************************************************/
/*                End Shard Miner Admin Endpoints               */
/****************************************************************/






/****************************************************************/
/*                Mainchain Miner Admin Endpoints               */
/****************************************************************/



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