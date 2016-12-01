"use strict";

var ttn = require("ttn"); // TTN MQTT client
var mqtt = require("mqtt"); // mqtt.js for Xively
var fs = require("fs"); // file system
var pg = require("pg"); // database
var pgConnStringParser = require('pg-connection-string');

var http = require("http");
var https = require("https");
var path = require("path");

var xiapi = require("./xively-api");

var express = require("express"); // server
var expressSession = require('express-session');
var bodyParser = require("body-parser")
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var app = express();

// Get port from the environment or use 8080 locally
var port = process.env.PORT || 8080;


/*
  READ CONFIGURATION
*/

// Connection parameters (filled from the database)
var xivelyBrokerUrl;
var xivelyBrokerPort;

var xivelyAccountId;
var xivelyIdUsername;
var xivelyIdPassword;

//var xivelyDeviceId;
//var xivelyPassword;

// Connector credentials (can be set during the setup process)
var CONNECTOR_USERNAME;
var CONNECTOR_PASSWORD;
var APP_DATABASE_URL;



// Reading environment variables (containing app credentials)

try
{
  log("Reading configuration...");

  var envVars = JSON.parse(fs.readFileSync("config/config.json", "utf8"));

  CONNECTOR_USERNAME = envVars.CONNECTOR_USERNAME;
  CONNECTOR_PASSWORD = envVars.CONNECTOR_PASSWORD;
  APP_DATABASE_URL = envVars.APP_DATABASE_URL;
}
catch (e)
{
  if(e.code === "ENOENT")
  {
    log("Local config file not found, reading environment variables.");

    CONNECTOR_USERNAME = process.env.CONNECTOR_USERNAME;
    CONNECTOR_PASSWORD = process.env.CONNECTOR_PASSWORD;
    APP_DATABASE_URL = process.env.APP_DATABASE_URL;
  }
  else {
      log("Error code: " + e.code);
  }
}



/*
  CREATE DATABASE CONFIGURATION

  The environment (or config.json) contains a connection string.
  we need to transform that to a config object, using the pg-connection-string parser
*/
var pgConfig = pgConnStringParser.parse(APP_DATABASE_URL);

// In addition to the connection parameters, we set the max number of pool clients and timeout
pgConfig.max = 20;
pgConfig.idleTimeoutMillis = 30000;

log("Connecting to the database using config: " + JSON.stringify(pgConfig));

var TTN_CLIENTS = [];
var XIVELY_CLIENT;

//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients
var databaseClientPool = new pg.Pool(pgConfig);

databaseClientPool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool 
  // the pool itself will emit an error event with both the error and 
  // the client which emitted the original error 
  // this is a rare occurrence but can happen if there is a network partition 
  // between your application and the database, the database restarts, etc. 
  // and so you might want to handle it and at least log it out 
  log('Database pool/client error', err.message, err.stack)
})



/*
  SET UP SERVER AND ROUTES
*/


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {

  var user = {
    id: 1,
    name: "admin"
  };

  done(null, user);
  /*User.findById(id, function(err, user) {
    done(err, user);
  });*/
});


/*var users = {
  'admin': {
    email: '',
    website: ' ',
    blog: ' '
  }
};

var findUserByUsername = function (username, callback) {
  // Perform database query that calls callback when it's done
  // This is our fake database
  if (!users[username])
    return callback(new Error(
      'No user matching '
       + username
      )
    );
  return callback(null, users[username]);
};*/


passport.use(new LocalStrategy(
  function(username, password, done) {
    //console.log(username + " " + password);
    if (username == CONNECTOR_USERNAME && password == CONNECTOR_PASSWORD) {
      
      var user = {
        id: 1,
        name: "admin"
      };

      return done(null, user);
    }
    else {
      return done(null, false, { message: "Incorrect credentials"} );
    }

    

    /*User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });*/
  }
));


app.set('port', port);
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Express session middleware setup
app.use(expressSession(
  {
    secret: "mySecretKey",
    resave: "false",
    saveUninitialized: "false"
  }
));
app.use(passport.initialize());
app.use(passport.session());


// Serve static files from css and img directories
app.use('/css', express.static(__dirname + '/static/css/'));
app.use('/img', express.static(__dirname + '/static/img/'));




// HOME PAGE
app.get("/", function(req, res) {
  var authenticated = req.isAuthenticated();
  res.render("pages/index", { authenticated: authenticated });
});


// LOGIN (GET)
app.get('/login', function(req, res) {

    var formAction = "login";

    if (req.query != null) {
      if (req.query.fw != null && req.query.fw != "") {
        formAction += "?fw=" + req.query.fw
      }
    }

    res.render("pages/login", { formAction: formAction })
});


// LOGIN (POST)
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.render('pages/login', { formAction: "login", badcredentials: true });
    }
    
    req.logIn(user, function(err) {
      if (err) { return next(err); }

      // check if we have a callback in the URL
      if (req.query != null) {
      var callback = req.query.fw;

      if (callback != null && callback != "") {
        res.redirect(callback);
      }
      else {
        res.redirect("/");
      }
    }
    else {
      res.redirect("/");
    }

    //return res.render('pages/index', { authenticated: true });
    });
  })(req, res, next);
});


// NOT AUTHORISED (GET)
app.get('/notauthorised', function(req, res) {
  res.render("pages/401");
});


// LOGOUT (GET)
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// CONFIGURATION (GET)
app.get('/configuration', function(req, res) {
  if (req.isAuthenticated()) {
    res.render("pages/configuration", { authenticated: true } );
    //renderAdminView(req, res, "configuration.html");
  }
  else {
    res.redirect('/login?fw=configuration');
  }
});


// MAPPING (GET)
app.get('/mapping', function(req, res) {
  if (req.isAuthenticated()) {
    res.render("pages/mapping", { authenticated: true } );
  }
  else {
    res.redirect('/login?fw=mapping');
  }
});







/*
  SETTINGS API
*/

app.get("/api/settings", function(req, res) {
  queryDb("SELECT * FROM settings ORDER BY setting_id ASC", function(err, results) {
    if (results.rowCount == 0) {
      res.json({});
    }
    else {
      var settingsRow = results.rows[0];

      var settings = {
        xi_broker_url: settingsRow.xi_broker_url
      };

      res.json(settingsRow);
    }
  });
});

app.put("/api/settings", function(req, res) {
  
  var params = [];
  //params.push(req.body.xi_broker_url, req.body.xi_broker_port, req.body.xi_account_id, req.body.conn_xi_device_id, req.body.conn_xi_device_pw);
  params.push(req.body.xi_broker_url, req.body.xi_broker_port, req.body.xi_account_id, req.body.xi_id_username, req.body.xi_id_password);

  if (req.body.setting_id == null || req.body.setting_id == "" || req.body.setting_id == 0) {

    log("Creating settings (Setting ID = " + req.body.setting_id + ", Xively broker URL = " + req.body.xi_broker_url + ", Xively broker port = " + req.body.xi_broker_port + ", Xively Account ID = " + req.body.xi_account_id + ", Xively username = " + req.body.xi_id_username + ", Xively PW = ***)");

    // This is the first time the settings are saved, let's create a new row
    insertDb("INSERT INTO settings (xi_broker_url, xi_broker_port, xi_account_id, xi_id_username, xi_id_password) VALUES ($1, $2, $3, $4, $5)", params, function(err, result) {
      if (err) {
        log("Couldn't create new settings row: " + JSON.stringify(err));
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
  }

  else {

    log("Updating settings (Setting ID = " + req.body.setting_id + ", Xively broker URL = " + req.body.xi_broker_url + ", Xively broker port = " + req.body.xi_broker_port + ", Xively Account ID = " + req.body.xi_account_id + ", Xively username = " + req.body.xi_id_username + ", Xively PW = ***)");

    // We have some settings already, but we are going to update them
    queryDb("UPDATE settings SET xi_broker_url = '" + req.body.xi_broker_url + "', xi_broker_port = " + req.body.xi_broker_port + ", xi_account_id = '" + req.body.xi_account_id + "', xi_id_username = '" + req.body.xi_id_username + "', xi_id_password = '" + req.body.xi_id_password + "' WHERE setting_id = " + req.body.setting_id, function (err, result) {
    
      if (err) {
        log("Couldn't update settings: " + JSON.stringify(err));
        
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });

  }

});



/*
  APPS API
*/

app.get("/api/apps", function(req, res) {
  queryDb("SELECT * FROM ttn_apps ORDER BY app_id ASC", function(err, results) {
    res.json(results.rows);
  });
});

app.put("/api/apps", function(req, res) {
  log("Creating new app (Name = " + req.body.name + ", App EUI = " + req.body.app_eui + ", Access Key = " + req.body.app_access_key + ")");
  
  var params = [];
  params.push(req.body.name, req.body.app_eui, req.body.app_access_key);

  insertDb("INSERT INTO ttn_apps (name, app_eui, app_access_key) VALUES ($1, $2, $3)", params, insertCallback);

  function insertCallback(err, result) {
        
    if (err) {
      log("Couldn't create new app: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  }
});

app.put("/api/apps/update", function(req, res) {
  log("Updating app (ID = " + req.body.app_id + ", Name = " + req.body.name + ", App EUI = " + req.body.app_eui + ", Access Key = " + req.body.app_access_key + ")");
  
  queryDb("UPDATE ttn_apps SET app_eui = '" + req.body.app_eui + "', name = '" + req.body.name + "', app_access_key = '" + req.body.app_access_key + "' WHERE app_id = " + req.body.app_id,
    function (err, result) {
    
    if (err) {
      log("Couldn't update app: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

app.delete("/api/apps/", function(req, res) {
  
  log("Deleting app (ID = " + req.body.appid + ")");
  
  queryDb("DELETE FROM ttn_apps WHERE app_id = '" + req.body.appid+ "'", function(err, result) {
  
    if (err) {
      log("Couldn't delete app: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});






/*
  DEVICES API
*/


app.get("/api/devices", function(req, res) {
  
  if(req.query.appeui == null) {
    res.status(400).send("Bad Request");
  }
  else {
    queryDb("SELECT * FROM ttn_devices WHERE app_eui = '" + req.query.appeui +  "' ORDER BY device_id ASC", function(err, results) {
      var result = {
        app_eui: req.query.appeui
        //devices: JSON.parse(results.rows)
      };

      res.json(results.rows);
    });
  }
});


app.put("/api/devices", function(req, res) {
  log("Creating new device (Dev EUI = " + req.body.device_eui + ", Xively Device ID = " + req.body.xi_device_id  + ", App EUI = " + req.body.app_eui + ", Device name = " + req.body.device_name + ")");
  
  var params = [];
  params.push(req.body.device_eui, req.body.xi_device_id, req.body.app_eui, req.body.device_name);

  insertDb("INSERT INTO ttn_devices (device_eui, xi_device_id, app_eui, device_name) VALUES ($1, $2, $3, $4)", params, insertCallback);

  function insertCallback(err, result) {
    
    if (err) {
      log("Couldn't create new device: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  }
});

app.put("/api/devices/update", function(req, res) {
  log("Updating device (ID = " + req.body.device_id + ", Dev EUI = " + req.body.device_eui + ", Xively Device ID = " + req.body.xi_device_id  + ", Device name = " + req.body.device_name + ")");
  
  queryDb("UPDATE ttn_devices SET device_eui = '" + req.body.device_eui + "', xi_device_id = '" + req.body.xi_device_id + "', device_name = '" + req.body.device_name + "' WHERE device_id = '" + req.body.device_id + "'",
    function (err, result) {
    
    if (err) {
      log("Couldn't update app: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

app.delete("/api/devices/", function(req, res) {
  
  log("Deleting device (ID = " + req.body.device_id + ")");
  
  queryDb("DELETE FROM ttn_devices WHERE device_id = '" + req.body.device_id + "'", function(err, result) {
  
    if (err) {
      log("Couldn't delete device: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});





/*
  MAPPINGS API
*/

app.get("/api/mappings", function(req, res) {
  queryDb("SELECT * FROM mappings WHERE app_eui = '" + req.query.appeui + "' ORDER BY mapping_id ASC", function(err, results) {
    res.json(results.rows);
  });
});

app.put("/api/mappings", function(req, res) {
  log("Creating new mapping (App EUI = " + req.body.app_eui + ", JSON source field = " + req.body.json_field + ", Xively topic = " + req.body.xi_topic + ", Time series = " + req.body.time_series + ", Category = " + req.body.category + ")");
  
  var params = [];
  params.push(req.body.app_eui, req.body.json_field, req.body.xi_topic, req.body.time_series, req.body.category);

  insertDb("INSERT INTO mappings (app_eui, json_field, xi_topic, time_series, category) VALUES ($1, $2, $3, $4, $5)", params, insertCallback);

  function insertCallback(err, result) {
    
    if (err) {
      log("Couldn't create new mapping: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  }
});

app.put("/api/mappings/update", function(req, res) {
  log("Updating mapping (ID = " + req.body.mapping_id + ", JSON source field = " + req.body.json_field + ", Xively topic = " + req.body.xi_topic + ", Time series = " + req.body.time_series + ", Category = " + req.body.category + ")");
  
  queryDb("UPDATE mappings SET json_field = '" + req.body.json_field + "', xi_topic = '" + req.body.xi_topic + "', time_series = '" + req.body.time_series + "', category = '" + req.body.category + "' WHERE mapping_id = '" + req.body.mapping_id + "'",
  
    function (err, result) {
      
      if (err) {
        log("Couldn't update mapping: " + JSON.stringify(err));
        
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
});

app.delete("/api/mappings/", function(req, res) {
  
  log("Deleting mapping (ID = " + req.body.mapping_id + ")");
  
  queryDb("DELETE FROM mappings WHERE mapping_id = '" + req.body.mapping_id + "'", function(err, result) {
  
    if (err) {
      log("Couldn't delete mapping: " + JSON.stringify(err));
      
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});


app.get("/api/restart", function(req, res) {

  log("---Restarting service...");

  disconnectFromAllApps();

  if (XIVELY_CLIENT != null) {
    
    XIVELY_CLIENT.end(true, function() {
      log("Connection to Xively closed");
    });
  }

  readSettings();
  res.sendStatus(200);
});


app.get('*', function(req, res){
  res.render("pages/404");
  //res.status(404).send("Not found");
});

// Start listening to requests
app.listen(process.env.PORT || 8080, function(){
  log('Express server listening on port ' + app.get('port'));
});





/*
  START BRIDGING FUNCTION
*/

readSettings();

function readSettings() {

  log("Reading Xively connection parameters from database...");

  queryDb("SELECT * FROM settings ORDER BY setting_id ASC", function(err, results) {
    if (results.rowCount == 0) {
      log("No Xively settings found. Please update the connection settings and restart the service");
    }
    else {

      var settings = results.rows[0];

      log("Xively configuration loaded from the database");

      xivelyBrokerUrl = settings.xi_broker_url;
      xivelyBrokerPort = Number(settings.xi_broker_port);

      xivelyAccountId = settings.xi_account_id;
      xivelyIdUsername = settings.xi_id_username;
      xivelyIdPassword = settings.xi_id_password;

      //xivelyDeviceId = settings.conn_xi_device_id;
      //xivelyPassword = settings.conn_xi_device_pw;

      // Initialise the Xively API module with the credentials that we received
      xiapi.init(xivelyAccountId, xivelyIdUsername, xivelyIdPassword);

      xiapi.getJWT(startBridge);
      //startBridge();
    }
  });

}

function startBridge(jwt) {
  
  //console.log("Received JWT: " + jwt);

  // In case it's a restart, disconnect all TTN connection before
  disconnectFromAllApps();

  // Connect to Xively
  log("Trying to connect to Xively...");

  var xivelyOptions = {
    port: xivelyBrokerPort,
    //clientId: xivelyDeviceId,
    //username: xivelyDeviceId,
    //password: xivelyPassword,
    clientId: "",
    username: "Auth:JWT",
    password: jwt

    //protocolId: "MQIsdp",
    //protocolVersion: 3

    // see: https://developer.xively.com/docs/connecting-and-disconnecting
  };

  
  
  XIVELY_CLIENT = mqtt.connect("tls://" + xivelyBrokerUrl, xivelyOptions);

  XIVELY_CLIENT.on("connect", function () {
    //xivelyClient.subscribe("xi/blue/v1/" + xivelyAccountId + "/d/" + xivelyDeviceId + "/light")
    //xivelyClient.publish("xi/blue/v1/" + xivelyAccountId + "/d/" + xivelyDeviceId + "/light", "Hello mqtt")
    log("Connected to Xively");
  });

  XIVELY_CLIENT.on("reconnect", function () {
    log("Trying to reconnect to Xively");
  });

  XIVELY_CLIENT.on("close", function () {
    log("Lost connection to Xively, won't attempt to reconnect. Please restart the service through the API.");
    this.end();
  });

  XIVELY_CLIENT.on("message", function (topic, message) { 
    log("Xively message received: " + message.toString())
  });

  XIVELY_CLIENT.on("error", function (error) {
    log("An error with the Xively client occured: " + error);
  });
  
  // Load TTN apps
  fetchTTNApps();

}


function fetchTTNApps () {
  
  /*
  
    queryDb returns a results object: https://github.com/brianc/node-postgres/wiki/Query#result-object
  
    command: The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
    rowCount: The number of rows affected by the SQL statement (more information)
    oid: The oid returned
    rows: An array of rows (if the addRow command is used)

  */

  queryDb("SELECT * FROM ttn_apps", connectToApps);

  function connectToApps (err, appsResult) {

    //APPS = appsResult.rows;
    log("Found " + appsResult.rowCount + " app(s) to connect to.");

    gotApps(appsResult.rows);

    function gotApps(apps) {

      // We have the apps, let's connect to all of them
      for (var i = 0; i < apps.length; i++) {

        var app = apps[i];

        log("Connecting to app '" + app.name + "'");

        // Set up a new client
        var newClient = new ttn.Client("staging.thethingsnetwork.org", app.app_eui, app.app_access_key);

        newClient.on("activation", function (e) {
          console.log("A new device (" + e.devEUI + ") has registered with app '" + app.name + "'");
        });

        newClient.on("connect", function () {
          log("Connected to app '" + app.name + "'");
        });
      
        newClient.on("error", function (err) {
        	//log("Connection to '" + app.name + "' failed.", err.message); // app.name not in the correct scope anymore
          log("Connection to one TTN app failed: " + err.message); // app.name not in the correct scope anymore
          this.end();
        });

        newClient.on("uplink", function (msg) {
          //log("'" + app.name + "' received a message.");
          handleMessage(msg);
          //console.info("[INFO] ", "Uplink: " + JSON.stringify(msg, null, 2));
        });

        // Add it to the global client pool
        TTN_CLIENTS.push(newClient);
      }
    }
  }

}

function handleMessage(msg) {

  // We received a message. Let's see what device it came from
  var deviceEUI = msg.devEUI;

  log("Received a message from device '" + deviceEUI + "'");
  log(JSON.stringify(msg, null, 2));

  // First, we need to check whether the device is registered in our connector
  queryDb("SELECT * FROM ttn_devices WHERE device_eui = '" + deviceEUI + "'", checkMatchingDevices);

  function checkMatchingDevices(err, devices) {

    var sourceDevice;

    if (devices.rowCount > 0) {

      // Since the device_eui is a unique primary key in the database, we found exactly one record
      sourceDevice = devices.rows[0];

      log("Found matching devices (Name = " + sourceDevice.device_name + ", Xively Device ID = " + sourceDevice.xi_device_id + "), checking mappings next...");

      // Let's check the application mappings to see what data we have to extract from the message and send to Xively
      queryDb("SELECT * FROM mappings WHERE app_eui = '" + sourceDevice.app_eui + "'", sendToXively);

      if (msg.metadata.longitude != null && msg.metadata.latitude != null) {
        // We handled all mappings, let's update the location of the device as well
        log("Updating device location...");
        log("Requesting JWT for Xively API");

        xiapi.updateDeviceLocation(sourceDevice.xi_device_id, msg.metadata.longitude, msg.metadata.latitude);
      }
    }

    else {
      // The device that has sent the data is not registered in our connector, so we are not going to forward any data to Xively
      log("The sending device is not registered in the connector.");
      return;
    }



    function sendToXively(err, mappings) {
      
      if (mappings.rowCount > 0) {

        // We found matching mappings, let's go through all of them and send the data to Xively
        
        for ( var i = 0; i < mappings.rowCount; i++) {

          var mapping = mappings.rows[i];

          log("Found mapping for device: " + mapping.json_field + " -> " + mapping.xi_topic);

          // Try to get payload
          var payload = msg["fields"][mapping.json_field];

          if (payload != null) {

            log("Mapped field was found in the payload. Bridging to Xively...");

            var topicPath = "xi/blue/v1/" + xivelyAccountId + "/d/" + sourceDevice.xi_device_id + "/" + mapping.xi_topic;

            // Check if field is a time series field
            if (mapping.time_series == true) {

              // Send time series payload to Xively (refer to: https://developer.xively.com/docs/storing-timeseries-data)
              // Timestamp,Category,Value,String
              
              var date = new Date();
              var category = mapping.category != null ? mapping.category : "";
              var timeseriesPayload = date.toISOString() + "," + category + "," + payload;

              XIVELY_CLIENT.publish(topicPath, timeseriesPayload);

              log("Sent payload '" + timeseriesPayload + "' to topic '" + topicPath + "'");
            }
            else {
              // Send payload to Xively
              XIVELY_CLIENT.publish(topicPath, payload.toString());

              log("Sent payload " + payload.toString() + " to topic '" + topicPath + "'");
            }

          }
          else {
            log("Field was not found in the payload, skipping the current mapping.");
          }
          
        }

      }
      else {
        log("No mappings were found for the source device.");
      }
    }
    
  }

} 


function disconnectFromAllApps() {

  if (TTN_CLIENTS != null) {

    for (var i = 0; i < TTN_CLIENTS.length; i++) {
    
      var client = TTN_CLIENTS[i];
      log("Disconnect from client");
      
      // Close the connection: https://github.com/TheThingsNetwork/node-app-lib/blob/master/API.md#method-end
      client.end();
    }

    TTN_CLIENTS = [];
  }
}




/*
  DATA ACCESS HELPER FUNCTIONS
*/

// Executes a query on the database, using a client from the pool
function queryDb(query, callback) {

  databaseClientPool.connect(function(err, client, done) {

    if(err) {
      return console.error("Error fetching database client from pool", err);
    }
    //console.log("Running query: " + query);
    client.query(query, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        return console.error("Error running query", err);
      }

      // Return result object: https://github.com/brianc/node-postgres/wiki/Query#result-object
      //console.log(result);
      callback(err, result);
      //return result;
    });
  });
}

// Executes a query on the database, taking a params object for insert queries, using a client from the pool
function insertDb(query, params, callback) {

  databaseClientPool.connect(function(err, client, done) {

    if(err) {
      return console.error("Error fetching database client from pool", err);
    }
    //console.log("Running query: " + query);
    client.query(query, params, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        //return console.error("Error running query", err);
      }

      // Return result object: https://github.com/brianc/node-postgres/wiki/Query#result-object
      //console.log(result);
      callback(err, result);
      //return result;
    });
  });
}



function log(msg) {
  var date = new Date();

  var dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + ('0'  + date.getMinutes()).slice(-2) + ":" + ('0'  + date.getSeconds()).slice(-2) + "." + ('00'  + date.getMilliseconds()).slice(-3);

  console.log(dateString + ": " + msg);
}