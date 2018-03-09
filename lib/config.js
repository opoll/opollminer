
const fs = require('fs');

/*
  The configuration manager handles misc configuration settings for the
  miner application.
*/

var ConfigManager = {};

// Initialize the configuration manager and load configs
ConfigManager.initialize = function() {
  // Attempt to read the config
  try {
    var rawConfigData = fs.readFileSync( './.config', 'utf8' );
  } catch(ex) {
    // Debug message
    console.log( "unable to load configuration; no configuration file found" );

    // Default and exit
    ConfigManager._configs = {};
    return;
  }

  // Convert the raw data to JSON
  ConfigManager._configs = JSON.parse( rawConfigData );
}

// Set a config
ConfigManager.set = function( configName, value ) {
  ConfigManager._configs[ configName ] = value;
}

// Get a config
ConfigManager.get = function( configName ) {
  // If not initialized..
  if( !ConfigManager._initialized ) {
    throw {
      name: "ConfigNotInitialized",
      message: "the configuration manager has not been configured"
    }
  }

  // If the config doesn't exist
  if( ConfigManager._configs[ configName ] == undefined ) {
    throw {
      name: "InvalidConfiguration",
      message: "attempt to access an invalid configuration setting: " + configName
    }
  }

  // Return the config value
  return ConfigManager._configs[ configName ];
}

// Save the configuration
ConfigManager.save = function() {
  return new Promise( function( resolve ) {
    fs.writeFile( './.config', JSON.stringify( ConfigManager._configs ), function() {
      resolve();
    } );
  } );
}

// Export the config manager
module.exports = ConfigManager;
