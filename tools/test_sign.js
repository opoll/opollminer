
// Imports
const crypto = require('crypto');
const fs = require('fs');

// Message to sign
var msg = "VALID RESPONDENT: ALEHAFIUSHFJKLSDAHFJKD";

// Get the public key
fs.readFile("../public_test.pem", function( error, pubKeyData ) {
  fs.readFile("../private_test.pem", function( error, privKeyData ) {

    // Sign the message
    var signer = crypto.createSign( 'SHA256' );
    signer.update( msg );
    var sign = signer.sign( privKeyData, 'hex' );
    console.log( sign );

  } );
} );
