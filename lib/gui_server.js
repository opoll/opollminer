
var guiServer = {};

const express = require('express');
const app = express();
const path = require('path');

guiServer.simpleRouter = function (req, res) {
  res.render('index', { req, res });
}

/*
  Start the GUI Server
*/
guiServer.start = function() {

  app.use(express.static(`${__dirname}/../gui-compiled`));

  app.get('*', function(req, res){
    res.sendFile(path.resolve('gui-compiled/index.html'));
  });

  app.listen(8080, () => {
    console.log( "GUI now listening on port :8080" );
  });
};

module.exports = guiServer;
