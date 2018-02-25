const crypto = require('crypto'); // Native crypto module
const elliptic = require('elliptic'); // Elliptic curve cryptography library
const EdDSA = elliptic.eddsa; // Edwards-curve Digital Signature Algorithm helpers
const RIPEMD160 = require('ripemd160'); // Helper library for RIPEMD (RACE Integrity Primitives Evaluation Message Digest) hashing
const bs58check = require('bs58check'); // Base 58 check encoding helper

const SALT = 'f34873900a03510d34116e9ef141896c6f0c138668a';
const ec = new EdDSA('ed25519'); // Create and initialize EdDSA context


class CryptoUtil {

    // Generate a hash given data and a hashing algorithm, sha256 is default hashing algorithm
    static hash(data, algo = 'sha256') {
        // Stringify data
        const dataStringified = stringifyData(data);

        // Hash data
        let hash;
        if(algo === 'sha256'){
            // Perform sha256 hash and format digest in hex
            hash = crypto.createHash('sha256').update(dataStringified).digest('hex');
        } else if (algo === 'ripemd160'){
            // Perform ripemd160 hash and format digest in hex
            hash = new RIPEMD160().update(dataStringified).digest('hex');
        }

        // Return hash
        return hash;
    }

    static generateRandomId(size = 64) {
        // Generates a random id 64 characters long
        return crypto.randomBytes(Math.floor(size / 2)).toString('hex');
    }

    // Generates a address given a public key and the versionByte of the address (00 for the main network)
    static generateAddress(publicKey, versionByte = '00'){
        // 1.) Perform SHA-256 hashing on the public key
        const pubKeyHash1 = hash(publicKey, 'sha256');

        // 2.) Perform RIPEMD-160 hashing on the result of SHA-256
        const pubKeyHash2 = hash(pubKeyHash1, 'ripemd160');

        // 3.) Add version byte in front of RIPEMD-160 hash
        const versionedPubKeyHash2 = versionByte + pubKeyHash2;

        // 4.) Perform SHA-256 hash on twice on the extended RIPEMD-160 result
        const dhashVersionedPubKeyHash2 = hash(hash(versionedPubKeyHash2));

        // 5.) Take the first 4 bytes of the second SHA-256 hash. This is the address checksum.
        const checksum = dhashVersionedPubKeyHash2.substring(0, 8);

        // 6.) Add the 4 checksum bytes to the end of pubKeyHash2
        const binaryAddress = pubKeyHash2 + checksum;

        // 7.) Convert the result from a byte string into a base58 string
        const address = bs58check.encode(binaryAddress);

        return address;

    }

    // Generates a secret given a password using pbkdf2
    static generateSecret(password){
        // Synchronously Password-Based Key Derivation Function 2 (PBKDF2) method call. Generates secret.
        return crypto.pbkdf2Sync(password, SALT, 100000, 512, 'sha512').toString('hex');
    }

    // Generates a
    static generateKeyPairFromSecret(secret){
        return ec.keyFromSecret(secret);
    }

    // Signs a plaintext message using the keyPair object that generateKeyPairFromSecret(secret) yields
    static sign(keyPair, message){
        return keyPair.sign(message).toHex().toLowerCase();
    }

    // Checks if the given signature is valid given an address, the signature, and the plaintextMessage
    static isValidSignature(address, signature, plaintextMessage){
        
    }

    // Converts data to hex format
    static toHex(data){
        return elliptic.utils.toHex(data);
    }

    // Stringifies data
    static stringifyData(data){
        // Stringify data. If object call JSON.stringify, if string just call toString
        return typeof (data) == 'object' ? JSON.stringify(data) : data.toString();
    }
}
