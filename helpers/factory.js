
// Create the factory
var factory = {};

// Helper Imports
var PollHelpers = require( './poll' );
var ShardBlockHelpers = require( './shard_block' );

/*
  Generate a /poll/poll object
*/
factory.generateTestPoll = function(
  timestamp = Math.floor(new Date() / 1000),
  expiry = Math.floor(new Date() / 1000) + 1440 * 60 * 5,
  totalFunding = 100,
  maxRespondents = 50,
  questions = ["Do you support the President?"],
  imageId = 1
) {
  var poll = {
    "timestamp": timestamp,
    "expiry": expiry,
    "totalFunding": totalFunding,
    "maxRespondents": maxRespondents,
    "questions": questions,
    "imageId": imageId
  };

  // Create a hash for the poll
  PollHelpers.hash( poll );

  // Return the poll
  return poll;
}

// Export the factory
module.exports = factory;
