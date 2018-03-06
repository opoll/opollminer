'use strict';

module.exports = function (app) {
    // route commands
    var routes = require('./routes/routes');
   
   //incoming commands
    app.route('/shard/peers').get(routes.getPeers);
};