'use strict';

var ttn = require('ttn');
var mqtt = require('mqtt')
const fs = require('fs');
var http = require('http');

// Connection parameters
var ttnAppEUI;
var ttnAccessKey;

var xivelyBrokerUrl;
var xivelyDeviceId;
var xivelyPassword;
var xivelyAccountId;

// Get port from the environment or use 8080 locally
var port = process.env.PORT || 8080;

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");
});

// Listen to requests
server.listen(port);

// Put a friendly message into the log
console.log("Listening at port " + port);


// Reading connection parameters
try
{
  console.log("Reading connection parameters...");

  var envVars = JSON.parse(fs.readFileSync('config.json', 'utf8'));

  ttnAppEUI = envVars.ttnAppEUI;
  ttnAccessKey = envVars.ttnAccessKey;

  xivelyBrokerUrl = envVars.xivelyBrokerUrl;
  xivelyDeviceId = envVars.xivelyDeviceId;
  xivelyPassword = envVars.xivelyPassword;
  xivelyAccountId = envVars.xivelyAccountId;
}
catch (e)
{
    if(e.code === 'ENOENT')
    {
        console.log("Local config file not found, reading environment variables.");
        
        ttnAppEUI = process.env.ttnAppEUI;
        ttnAccessKey = process.env.ttnAccessKey;

        xivelyBrokerUrl = process.env.xivelyBrokerUrl;
        xivelyDeviceId = process.env.xivelyDeviceId;
        xivelyPassword = process.env.xivelyPassword;
        xivelyAccountId = process.env.xivelyAccountId;
    }
    else
        console.log("Error code: " + e.code);
}

// The Things Network connection
console.log("Trying to connect to TTN...");
var ttnClient = new ttn.Client('staging.thethingsnetwork.org', ttnAppEUI, ttnAccessKey);

// Xively connection
console.log("Trying to connect to Xively...");

var xivelyOptions = {
  port: 443,
  clientId: xivelyDeviceId,
  username: xivelyDeviceId,
  password: xivelyPassword,

  //protocolId: 'MQIsdp',
  //protocolVersion: 3
};

try {
  var xivelyClient = mqtt.connect('tls://' + xivelyBrokerUrl, xivelyOptions)
}
catch (e) {
  console.log("Couldn't connecto to Xively: " + e.message);
}


/*
 * TTN callbacks
 */

ttnClient.on('connect', function () {
	console.log('Connected to TTN');
});

ttnClient.on('error', function (err) {
	console.error('[ERROR]', err.message);
});

ttnClient.on('activation', function (e) {
	console.log('[INFO] ', 'Activated: ', e.devEUI);
});

ttnClient.on('uplink', function (msg) {
	console.info('[INFO] ', 'Uplink: ' + JSON.stringify(msg, null, 2));
});

ttnClient.on('uplink', function (msg) {

  console.log("TTN message received: " + msg);

  xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/up', JSON.stringify(msg));

  
  if (msg.fields.button != null) {
    xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/button', msg.fields.button.toString());
  }

  if (msg.fields.humidity != null) {
    xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/humidity', msg.fields.humidity.toString());
  }

  if (msg.fields.light != null) {
    xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/light', msg.fields.light.toString());
  }

  if (msg.fields.temperature != null) {
    xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/temperature', msg.fields.temperature.toString());
  }
	// respond to every third message
	/*if (msg.counter % 3 === 0) {
		console.log('[DEBUG]', 'Downlink');

		var payload = new Buffer('4869', 'hex');
		//client.downlink(msg.devEUI, payload);
	}*/
});



/*
 * Xively callbacks
 */ 
 
// Details see: https://github.com/mqttjs/MQTT.js
 
xivelyClient.on('connect', function () {
  xivelyClient.subscribe('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/light')
  console.log("Connected to Xively");
  //xivelyClient.publish('xi/blue/v1/' + xivelyAccountId + '/d/' + xivelyDeviceId + '/light', 'Hello mqtt')
});

xivelyClient.on('reconnect', function () {
  console.log("Trying to reconnect to Xively");
});

xivelyClient.on('close', function () {
  console.log("Lost connection to Xively");
});
 
xivelyClient.on('message', function (topic, message) { 
  console.log("Xively message received: " + message.toString())
});

xivelyClient.on('error', function (error) {
  console.log("An error with the Xively client occured: " + error);
});