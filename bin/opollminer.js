#!/usr/bin/env node
const program = require('commander');
require('events').EventEmitter.defaultMaxListeners = 16; // Possible EventEmitter memory leak here. Revise later but don't ignore this. Limit is 11 by default.

// Program meta information
program
    .version('0.1.0')
    .description('OpenPoll Mining Application');

// command 'shards'
program
    .command('shards')
    .description("Displays a list of pollId's that the miner pull in to work on")
    .action(function (){
        console.log('Fetching list of active shards...');
    });

// command 'status'
program
    .command('status')
    .description("Display the working status of this node.")
    .action(function (){
        console.log('Actively Mining:');
        console.dir([
            "91c73e207700e2e66fc36638ec359a6f237f3c84c885441b01fccb32c8466fab",
            "d576d500c031da483afdfa19956d721667dd64ec91409dd4afa260eea2c8887e"
        ])
        console.log('Shards Ready To Mine:');
        console.dir([
            "682331cf28bb5f65b906c9689744a604611edb607044d50dcde38c1d5fa58d49"
        ])
        console.log('Shards Not Ready To Mine:');
        console.dir([
            "30b0f0422f2a2f28844b702360ee31c9af4a0575858cfe371db43f19e1c2d96d"
        ])
    });

// command 'fetch <pollId>'
program
    .command('fetch <pollId>')
    .description("Fetches the genesis block or best blockchain for this pollId (or main chain)")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Fetching main chain...`);
            setTimeout(function(){
                console.log('Success! Main chain fetched.');
                console.dir({
                    fetchComplete: true,
                    mempoolImported: true,
                    statusBroadcasted: true
                })
            }, 3000);
        } else {
            console.log(`Fetching ${pollId}...`);
            setTimeout(function(){
                console.log(`Success! ${pollId} fetched.`);
                console.dir({
                    fetchComplete: true,
                    mempoolImported: true,
                    statusBroadcasted: true
                })
            }, 3000);
        }
    });

// command 'purge <pollId>'
program
    .command('purge <pollId>')
    .description("")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Purging main chain...`);
            setTimeout(function(){
                console.log('Success! Main chain purged.');
                console.dir({
                    dbCleared: true,
                    statusBroadcasted: true
                })
            }, 3000);
        } else {
            console.log(`Purging ${pollId}...`);
            setTimeout(function(){
                console.log(`Success! ${pollId} purged.`);
                console.dir({
                    dbCleared: true,
                    statusBroadcasted: true
                })
            }, 3000);
        }
    });

// command 'startmine <pollId>'
program
    .command('startmine <pollId>')
    .description("")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Mining main chain...`);
        } else {
            console.log(`Mining on shard ${pollId}...`);
            setTimeout(function(){
                console.log(`Block Found for shard ${pollId}! Broadcasting block.`);
                console.dir({
                    index: 12,
                    pollId: `${pollId}`,
                    timestamp: 1519023494,
                    rewardAddress: 'c258f2a4...6851bea091',
                    nonce: 1920498,
                    prevHash: 'c23fc3f73...d1e1cf7b2f',
                    hash: 'c02gjf73...d1e83ghcdff',
                    responses: [
                        '{ ...pollResponse... }',
                        '{ ...pollResponse... }',
                        '{ ...pollResponse... }'
                    ]
                })
            }, 3000);
        }
    });

// command 'stopmine <pollId>'
program
    .command('stopmine <pollId>')
    .description("")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Stopped mining on main chain. Broadcasting status...`);
        } else {
            console.log(`Stopped mining on ${pollId}. Broadcasting status...`);
        }
    });

// command 'rescan <pollId>'
program
    .command('rescan <pollId>')
    .description("")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Fetching main chain mempool & syncing...`);
        } else {
            console.log(`Fetching mempool for ${pollId} & syncing...`);
        }
    });

// command 'blockchain <pollId>'
program
    .command('blockchain <pollId>')
    .description("Fetch & display the blockchain for the specified pollId if the miner holds it locally")
    .action(function (pollId){
        if(pollId === 'main'){
            console.log(`Displaying mainchain.`);
        } else {
            console.log(`Displaying chain for pollId ${pollId}`);
        }
    });

// command 'block <pollId> <blockindex>'
program
    .command('block <blockIndex> <pollId>')
    .description("Fetch & display block at height <blockindex> for the specified pollId if the miner holds it locally")
    .action(function (blockIndex, pollId){
        if(pollId === 'main'){
            console.log(`Displaying mainchain block at height ${blockIndex}:`);
        } else {
            console.log(`Displaying ${pollId} block at height ${blockIndex}:`);
        }
    });

// command 'wallet create <password>'
program
    .command('walletcreate <password>')
    .description("Creates a new wallet with one address given a password.")
    .action(function (password){
        console.log('Wallet created.');
    });

// command 'wallet all'
program
    .command('walletall')
    .description("Gets all wallets that the miner holds")
    .action(function (){
        console.log('Displaying all wallets.');
    });

// command 'wallet addresses <walletId>'
program
    .command('walletaddresses <walletId>')
    .description("Gets addresses for a given walletId that a miner owns")
    .action(function (walletId){
        console.log(`Displaying all addresses for wallet with id ${walletId}.`);
    });

// command 'wallet balance <walletId>'
program
    .command('walletbalance <walletId>')
    .description("Gets balance for given walletId that a miner owns")
    .action(function (walletId){
        console.log(`Displaying balance for wallet with id ${walletId}.`);
    });

// command 'start'
program
    .command('start')
    .description("Starts the server, catches the node up with the network, and listens for connections")
    .action(function (){
        console.log("Server Started! Listening for connections on port 8333.");
        console.log("Synching node with network & broadcasting presence...");
    });

// command 'stop'
program
    .command('stop')
    .description("Stops the server and node stops listening for connections")
    .action(function (){
        console.log("Server Stopped. Goodbye.");
    });

// command 'info'
program
    .command('info')
    .description("Get info about the OpenPoll Miner application")
    .action(function (){
        console.log('We are building a blockchain-based polling platform which is anonymous, verifiable, and decentralized. With transparency and the ability to reach a larger audience, we ensure correctness.');
    });

program.parse(process.argv);
