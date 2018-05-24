// External Libraries
const chalk = require('chalk');
const ip = require('ip');
const crypto = require('crypto');
const fs = require("fs");
// Databases
const databases = require('../util/databases');

// Function used to generate adminAuthToken embedded in served client Angular interface
function generateAdminToken(){
    return Base64(randomAlphanumeric() + ";" + ip.address() + ";" + process.env.MINERPORT);
}

// Generates hex string by default 32 bytes in size
function randomAlphanumeric(size = 32) {
    return crypto.randomBytes(Math.ceil(size))
        .toString('hex'); // convert to hex format
}

// Convert unencoded string into Base64 format
function Base64(unencoded){
    return Buffer.from(unencoded).toString('base64')
}

// Generates a new admin auth token if one does not already exist.
// otherwise just prints current token to the console
function generateAndPrintAuthToken(){
    // Fetch token held in LevelDb
    databases.ShardMiner.get("adminAuthToken", function(err, adminAuthToken){
        // Token to be printed to the console
        let token;
        
        if(adminAuthToken == null || adminAuthToken == undefined){
            // Token does not exist. Generate and store a new one
            token = generateAdminToken();
           
            databases.ShardMiner.put("adminAuthToken", token, function(err){
                if (err) return console.log('There was a problem saving the new admin auth token.', err);
            });
        } else {
            // Token does exist. Set it to be printed.
            token = adminAuthToken;
        }
        fs.writeFileSync("./token", token);
    
        console.log( chalk.green( "AdminAuthToken1: " + token ) ); // Log the token to the console for miner reference
    });
}


module.exports.generateAndPrintAuthToken = generateAndPrintAuthToken;