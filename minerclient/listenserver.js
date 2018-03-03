'use strict';

module.exports = function (app) {
  // Import routes
  var routes = require('./routes/routes');

  // P2P Routes
  app.route('/shard/peers').get(routes.getPeers);
};
