
// Imports
const crypto = require('crypto'); // Native crypto module
const bcrypt = require('bcryptjs'); // bcrypt lib
const elliptic = require('elliptic'); // Elliptic curve cryptography library
const EdDSA = elliptic.eddsa; // Edwards-curve Digital Signature Algorithm helpers
const RIPEMD160 = require('ripemd160'); // Helper library for RIPEMD (RACE Integrity Primitives Evaluation Message Digest) hashing
const bs58check = require('bs58check'); // Base 58 check encoding helper

const ec = new EdDSA('ed25519'); // Create and initialize EdDSA context

// Create the library
var lib = {};

// Schema Version
lib.SCHEMA_VERSION = "0.1";

/*
  Stringifies data depending on type passed in
*/
lib.stringifyData = function(data){
  // Stringify data. If object call JSON.stringify, if string just call toString
  return typeof (data) == 'object' ? JSON.stringify(data) : data.toString();
}

/*
  Generate a hash given data and a hashing algorithm, sha256 is default hashing algorithm
*/
lib.hash = function(data, algo = 'sha256') {
  // Stringify data
  const dataStringified = stringifyData(data);

  // Hash data using selected algorithm
  let finalHash;
  if(algo == 'sha256'){
      // Perform sha256 hash and format digest in hex
      finalHash = crypto.createHash('sha256').update(dataStringified).digest('hex');
  } else if (algo == 'ripemd160'){
      // Perform ripemd160 hash and format digest in hex
      finalHash = new RIPEMD160().update(dataStringified).digest('hex');
  } else if (algo == 'bcrypt'){
      // Hash using bcrypt algo
      const salt = bcrypt.genSaltSync(13);
      finalHash = bcrypt.hashSync(dataStringified, salt);
  }

  return finalHash;
}

/*
  Given a public key, this function converts the public key into an
  address
  Note: OpenPoll Standard Spec is that addresses are Base64, not Hex
*/
lib.publicKeyToAddress = function(publicKey, versionByte = '00') {
  // 1.) Perform SHA-256 hashing on the public key
  const pubKeyHash1 = lib.hash(publicKey, 'sha256');

  // 2.) Perform RIPEMD-160 hashing on the result of SHA-256
  const pubKeyHash2 = lib.hash(pubKeyHash1, 'ripemd160');

  // 3.) Add version byte in front of RIPEMD-160 hash
  const versionedPubKeyHash2 = versionByte + pubKeyHash2;

  // 4.) Perform SHA-256 hash on twice on the extended RIPEMD-160 result
  const dhashVersionedPubKeyHash2 = lib.hash(lib.hash(versionedPubKeyHash2));

  // 5.) Take the first 4 bytes of the second SHA-256 hash. This is the address checksum.
  const checksum = dhashVersionedPubKeyHash2.substring(0, 8);

  // 6.) Add the 4 checksum bytes to the end of pubKeyHash2
  const binaryAddress = versionedPubKeyHash2 + checksum;

  // 7.) Convert the result from a byte string into a base58 string
  const address = bs58check.encode(Buffer.from(binaryAddress, 'hex'));

  return address;
}

/*
  Generate random id. Default size is 32 byte (hex string)
*/
lib.generateRandomId = function(size = 64) {
  // Generates a random id 64 characters long
  return crypto.randomBytes(Math.floor(size / 2)).toString('hex');
}

// Generates a secret given a password using pbkdf2
lib.generateSecret = function(passwordHash){
  // Synchronously Password-Based Key Derivation Function 2 (PBKDF2) method call. Generates secret.
  const salt = bcrypt.genSaltSync(13);
  return crypto.pbkdf2Sync(passwordHash, salt, 100000, 512, 'sha512').toString('hex');
}

// Generates a key pair from a provided secret with metadata about ECDSA curve
lib.generateKeyPairFromSecret = function(secret){
  return ec.keyFromSecret(secret);
}

// Gets public key as hex from the keypair containing meta data
lib.getPublicFromKeypair = function(keyPair){
  return elliptic.utils.toHex(keyPair.getPublic());
}

/*
  TODO: Get private key from keypair
*/
lib.getPrivateFromKeypair = function(keyPair){
  
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
