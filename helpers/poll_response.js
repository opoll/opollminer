
// Imports
var crypto = require('crypto');
var NodeRSA = require('node-rsa');
var schemaValidator = require('jsonschema').validate;
var helper_generic = require('./blockchain_generic');

// Create the library
var lib = {};

// Path to a block schema
lib.BLOCK_SCHEMA_PATH = "/poll/response";
lib.BLOCK_SCHEMA = require( "../schemas/" + helper_generic.SCHEMA_VERSION + lib.BLOCK_SCHEMA_PATH + ".json" );

/*
  Given a main chain block, this function will return true if the input
  conforms to schema and false if the schema is invalid
*/
lib.validateSchema = function( obj ) {
  return schemaValidator( obj, lib.BLOCK_SCHEMA );
}

/*
  Returns fields which are baked into the hash
*/
lib.bakedFields = function( pollResponseObj ) {
  return {
    hash: pollResponseObj.responseHash,
    fields: {
      pollHash: pollResponseObj.pollHash,
      timestamp: pollResponseObj.timestamp,
      respondentAddr: pollResponseObj.respondentAddr,
      rewardAddr: pollResponseObj.rewardAddr,
      responses: pollResponseObj.responseData,
      respondentDemographics: pollResponseObj.respondentDemographics
    }
  }
}

/*
  This function produces a hash representing this poll response
  A poll response includes the following fields:
    * pollHash
    * timestamp
    * respondentAddr
    * rewardAddr
    * respondeData
    * respondentDemographics
*/
lib.orderedHashFields = function( o ) {
  var arr = [
    o.pollHash,
    o.timestamp.toString(),
    o.respondentAddr,
    o.rewardAddr || ""
  ];

  // Include response data
  o.responseData.forEach( function( responseStr ) {
    arr.push( responseStr );
  } );

  // Include demographic information
  // TODO

  return arr;
}

/*
  Returns a hash identifier of a poll
*/
lib.hash = function( o, digestType = "hex" ) {
  // Update the hash on the poll object
  o.responseHash = helper_generic.hashFromOrderedFields( lib.orderedHashFields( o ), digestType );

  // Return the hash
  return o.responseHash;
}

/*
  Given an array of poll responses, this function produces a hash to
  represet the ordered set of responses
*/
lib.hashResponses = function( pollResponseArr, digestType = "hex" ) {
  // Create HMAC with basic block information
  var hmac = crypto.createHmac( 'sha256', '' );

  // Loop through all provided poll responses
  pollResponseArr.forEach( function( pollObj ) {
    hmac = hmac.update( lib.hash( pollObj ) );
  } );

  // Grab a hex digest and return
  return hmac.digest( digestType );
}

/*
  This function takes a poll response and validates the signature of the
  response corresponds to the public address. This function requires the
  public key of the respondent.
*/
lib.validateSignature = function( pollResponseObj, respondentPubKeyData = null ) {
  // If no public key could be found..
  if( (respondentPubKeyData == undefined) && (pollResponseObj.respondentPublicKey == undefined) ) {
    throw {
      name: "UnknownRespondentPublicKey",
      message: "unable to locate the public key of the respondent"
    };
  }

  // Convert the public key to an address
  var respondentAddr = helper_generic.publicKeyToAddress( respondentPubKeyData || pollResponseObj.respondentPublicKey );

  /*
    Because the signature verification is intrinsically related to the
    response hash, we will force recompute a response hash to ensure integrity
  */
  pollResponseObj.responseHash = lib.hash( pollResponseObj );

  // Create an RSA Public Key Object
  var respondentPubKey = (new NodeRSA());
  respondentPubKey.importKey(respondentPubKeyData || pollResponseObj.respondentPublicKey, 'pkcs8-public-pem');

  /*
    To prevent a valid respondent from spoofing a response from another user,
    we ensure the respondentAddr listed in the response object aligns with the
    protected public key.
  */
  if( pollResponseObj.respondentAddr !== respondentAddr ) {
    throw {
      name: "InvalidRespondentAddress",
      message: "the address specified in the response does not correspond to the provided public key"
    };
  }

  /*
    To verify the signature itself we ensure the respondent public key authored the signature
    specified in the response object, and the signature was derived from the response hash.
  */
  if( !respondentPubKey.verify( pollResponseObj.responseHash, pollResponseObj.signature, null, 'hex' ) ) {
    throw {
      name: "InvalidSignature",
      message: "the signature provided does not match this response or was not authored by the respondent"
    };
  }

  // Success
  return true;
}

/*
  Create a signature for a given poll with the provided private key
*/
lib.sign = function( pollResponseObj, privateKeyData, rewardAddr = undefined ) {
  // Import the private key
  var respondentPrivKey = new NodeRSA();
  respondentPrivKey.importKey( privateKeyData, "pkcs8-private-pem" );

  // Derive the public key
  var publicPlaintext = respondentPrivKey.exportKey( 'pkcs8-public-pem' );

  // Calculate the address
  var respondentAddr = helper_generic.publicKeyToAddress( publicPlaintext );

  // Update the poll response object..
  pollResponseObj.respondentPublicKey = publicPlaintext;
  pollResponseObj.respondentAddr = respondentAddr;
  pollResponseObj.rewardAddr = rewardAddr || pollResponseObj.rewardAddr;

  // Recompute the response hash
  pollResponseObj.responseHash = lib.hash( pollResponseObj );

  // Compute a signature
  pollResponseObj.signature = respondentPrivKey.sign( pollResponseObj.responseHash, 'hex' );
}

// Export the library
module.exports = lib;
