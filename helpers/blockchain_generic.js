
// Imports
var crypto = require('crypto');

// Create the library
var lib = {};

// Schema Version
lib.SCHEMA_VERSION = "0.1";

/*
  Given a public key, this function converts the public key into an
  address
  Note: OpenPoll Standard Spec is that addresses are Base64, not Hex
*/
lib.publicKeyToAddress = function( pubKey ) {
  return crypto.createHash('sha256').update(pubKey).digest('base64');
}

/*
  Given an array of ordered field values this function will produce a SHA-256
  hash
*/
lib.hashFromOrderedFields = function( arr, digestType = "hex" ) {
  var hmac = crypto.createHash( 'sha256' );

  arr.forEach( function( v ) {
    hmac = hmac.update( v );
  } );

  return hmac.digest( digestType );
}

// Export our helpers
module.exports = lib;
