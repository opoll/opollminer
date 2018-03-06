
var fs = require('fs');
var deleteFolderRecursive = function( path, rmRoot = true ) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        if( file !== ".gitignore" )
          fs.unlinkSync(curPath);
      }
    });

    if( rmRoot )
      fs.rmdirSync(path);
  }
};

afterEach( function( done ) {
  deleteFolderRecursive('./db/automated_testing', false);
  done();
} );
