'use strict';

var ttn = require('ttn');
var paho = require('paho-mqtt')

// The Things Network connection
var appEUI = process.env.ttnAppEUI;
var accessKey = process.env.ttnAccessKey
var ttnClient = new ttn.Client('staging.thethingsnetwork.org', appEUI, accessKey);

// Xively connection
var xivelyDeviceId = process.env.xivelyDeviceId;
var xivelyPassword = proces.env.xivelyPassword;

var xivelyClient = new Paho.MQTT.Client("broker.xively.com", 443, "");
xivelyClient.onConnectionLost = onConnectionLost;
xivelyClient.onMessageArrived = onMessageArrived;
xivelyClient.connect(
{
    userName: xivelyDeviceId,
    password: xivelyPassword,
    useSSL: true,
    onSuccess: onConnect
});

/*
 * TTN callbacks
 */

ttnClient.on('connect', function () {
	console.log('[DEBUG]', 'Connected');
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

	// respond to every third message
	if (msg.counter % 3 === 0) {
		console.log('[DEBUG]', 'Downlink');

		var payload = new Buffer('4869', 'hex');
		client.downlink(msg.devEUI, payload);
	}
});



/*
 * Xively callbacks
 */ 
 
// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("Connected");
  //xivelyClient.subscribe("/World");
  //message = new Paho.MQTT.Message("Hello");
  //message.destinationName = "/World";
  //xivelyClient.send(message);
}
 
// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Xively client lost connection: " + responseObject.errorMessage);
  }
}
 
// called when a message arrives
function onMessageArrived(message) {
  console.log("Xively client received message: " + message.payloadString);
}