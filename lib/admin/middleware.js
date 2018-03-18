// Databases
const databases = require('../util/databases');

function verifyToken(req, res, next){
    const authHeader = req.get('Authorization'); // Extract Authorization header

    if (!authHeader) {
        // Auth header not found. Reject request with 401 'Unauthorized'.
        res.status(401);
        return res.json({
            error: "Error: Authorization header not provided. You are not authorized to access this resource."
        });
    }

    // Header found. Isolate.
    const tokenSplit = authHeader.split(' ');
    const token = tokenSplit[1]; // Removes 'Bearer: ' from authHeader string

    // Fetch token held in LevelDb
    databases.ShardMiner.get("adminAuthToken", function(err, adminAuthToken){
        if (err) return console.log('Problem fetching the adminAuthToken from the db.', err);
        
        // Compare isolated token to what is in mining app instance's LevelDb.
        if(token != adminAuthToken){
            // Auth token is incorrect. Reject request.
            res.status(401);
            return res.json({
                error: "Error: Authorization token is invalid. Please request this resource with a valid Authorization token."
            });
        }

        //At this point token is valid. Call next(). Endpoint access granted.
        next();
    });
}

module.exports.verifyToken = verifyToken;