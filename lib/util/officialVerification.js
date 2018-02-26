// Imports
const level = require('level');
const crypto = require('crypto');
const fs = require('fs');

// Exported Module
var OfficialVerification = {};

/*
  Returns a list of official public keys
  1) Checks the cache and returns cached public keys which have been verified
  2) If cache is expired, it pulls from the OpenPoll API
*/
OfficialVerification.getPubKeys = function() {
  // Return a promise containing everything...
  return new Promise( function( resolve, reject ) {

    // If we cached the public keys in immediate memory
    if( this._checkedCache ) {
      return resolve( this._pubKeyCache );
    }

    // Check secondary storage
    var db = level( './db/misc' );

    // Get a list of official public keys
    db.get( 'official_pkeys' )

    // If they exist
    .then( function( officialPublicKeysStr ) {
      // Convert the JSON string to an object
      var officialPublicKeys = JSON.parse( officialPublicKeysStr );

      // Cache the public keys
      OfficialVerification._pubKeyCache = officialPublicKeys;

      // Resolve the promise with what we found
      return resolve( officialPublicKeys );
    } )

    // If the public keys do not exist...
    .catch( function() {
      // TODO: API REQUEST TO FETCH KEYS
      fs.readFile("./public_test.pem", function( error, pubKeyData ) {
        var publicKeys = [ pubKeyData + "" ];

        // Store the public keys
        db.put( 'official_pkeys', JSON.stringify( publicKeys ) );

        // Return the fetched public keys
        resolve( publicKeys );
      } );
    } );
  } );
};

/*
  Verify if a message and corresponding signature are official
*/
OfficialVerification.isMessageOfficial = function( message, signature ) {
  return new Promise( function( resolve, reject ) {

    // Fetch public keys
    OfficialVerification.getPubKeys().then( function( officialPublicKeys ) {
      // Loop through all valid public keys and compare signatures
      officialPublicKeys.forEach( function( pubKey ) {
        // Did the private key associated with this public produce the signature above?
        var verify = crypto.createVerify('SHA256');
        verify.update( message, 'utf8' );

        if( verify.verify( pubKey, signature, 'base64' ) ) {
          return resolve( "" );
        }
      } );

      // We could not verify the signature..
      return reject( "" );
    } );

  } );
};

module.exports = OfficialVerification;
