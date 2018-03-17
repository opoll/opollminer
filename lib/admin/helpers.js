const ip = require('ip');
const crypto = require('crypto');

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

module.exports.generateAdminToken = generateAdminToken;