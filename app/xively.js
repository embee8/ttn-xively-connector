var https = require("https");

var exports = module.exports = {};

// Initialised when module is loaded
var ACCOUNT_ID;
var USERNAME;
var PASSWORD;

// used for temporary storage
var JWT;

exports.init = function(accountId, username, password) {
    ACCOUNT_ID = accountId;
    USERNAME = username;
    PASSWORD = password;
};

exports.getJWT = function(callback) {

    var jwtRequestData = {
        emailAddress: USERNAME,
        password: PASSWORD,
        accountId: ACCOUNT_ID,
        renewalType: "short"
    };

    var jwtRequestDataString = JSON.stringify(jwtRequestData);

    //console.log(jwtRequestDataString);
    //console.log("Length = " + jwtRequestDataString.length);

    var options = {
        host: "id.xively.com",
        port: 443,
        path: '/api/v1/auth/login-user',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': jwtRequestDataString.length
        },
    };

    // Set up the request
    var jwtRequest = https.request(options, function(res) {

        var data = "";

        // this event fires many times, each time collecting another piece of the response
        res.on("data", function (chunk) {
            // append this chunk to our growing `data` var
            data += chunk;
        });

        // this event fires *one* time, after all the `data` events/chunks have been gathered
        res.on("end", function () {
            
            //console.log("Response from the Xively Identity API: ");

            if (data != "") {
                
                try {
                    var jsonData = JSON.parse(data);
                    //console.log(jsonData);

                    if (jsonData != null && jsonData.jwt != null) {

                        // We have a JWT, let's return to the callback
                        callback(jsonData.jwt);
                    }
                } catch(e) {
                    console.log("Error: " + e.message);
                }
            }
            
            else {
                console.log("User couldn't be logged in.")
            }

        });

    });

    jwtRequest.on('error', (e) => {
        console.error("Error during user login: " + e);
    });

    // Send data to the API
    jwtRequest.write(jwtRequestDataString);

    // End the request
    jwtRequest.end();
}


exports.updateDeviceLocation = function(deviceId, longitude, latitude) {

    /*
        First, we have to log in the user
    */

    var jwtRequestData = {
        emailAddress: USERNAME,
        password: PASSWORD,
        accountId: ACCOUNT_ID,
        renewalType: "short"
    };

    var jwtRequestDataString = JSON.stringify(jwtRequestData);

    //console.log(jwtRequestDataString);
    //console.log("Length = " + jwtRequestDataString.length);

    var options = {
        host: "id.xively.com",
        port: 443,
        path: '/api/v1/auth/login-user',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': jwtRequestDataString.length
        },
    };

    // Set up the request
    var jwtRequest = https.request(options, function(res) {

        var data = "";

        // this event fires many times, each time collecting another piece of the response
        res.on("data", function (chunk) {
            // append this chunk to our growing `data` var
            data += chunk;
        });

        // this event fires *one* time, after all the `data` events/chunks have been gathered
        res.on("end", function () {
            
            //console.log("Response from the Xively Identity API: ");

            if (data != "") {
                
                try {
                    var jsonData = JSON.parse(data);

                    if (jsonData != null && jsonData.jwt != null) {
                        //JWT = jsonData.jwt;
                        //console.log("User logged in, JWT = " + jsonData.jwt)

                        // User logged in, let's update the device
                        //updateDevice(deviceId, latitude, longitude);

                        /*
                            Once, we are logged in, we will get the latest device status
                        */
                        getDevice(deviceId, jsonData.jwt, latitude, longitude);
                    }
                } catch(e) {
                    console.log("Error: " + e.message);
                }
            }
            
            else {
                console.log("User couldn't be logged in.")
            }

        });

    });

    jwtRequest.on('error', (e) => {
        console.error("Error during user login: " + e);
    });

    // Send data to the API
    jwtRequest.write(jwtRequestDataString);

    // End the request
    jwtRequest.end();

}

function getDevice(deviceId, jwt, latitude, longitude) {
    
    //console.log("Get latest device status...");

    var options = {
        host: "blueprint.xively.com",
        //port: 443,
        path: '/api/v1/devices/' + deviceId,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + jwt
        },
    };

    //console.log(options);

    // Set up the request
    var request = https.request(options, function(res) {

        var data = "";

        // this event fires many times, each time collecting another piece of the response
        res.on("data", function (chunk) {
            // append this chunk to our growing `data` var
            data += chunk;
        });

        // this event fires *one* time, after all the `data` events/chunks have been gathered
        res.on("end", function () {
            
            //console.log("Response from the Xively Identity API: ");

            //console.log(data);

            if (data != "") {
                var jsonData = JSON.parse(data);

                if (jsonData.device != null && jsonData.device.version) {
                    //JWT = jsonData.jwt;
                    //console.log("Got the latest device state, version = " + jsonData.device.version)
                    //console.log(this.headers.etag);

                    updateDevice(deviceId, jwt, latitude, longitude, jsonData.device.version);
                    //updateDevice(deviceId, latitude, longitude, this.headers.etag);
                }
            }
            /*
            else {
                console.log("User couldn't be logged in.")
            }*/

        });

    });

    request.on('error', (e) => {
        console.error("Error during updating device: " + e);
    });

    // Send data to the API

    // End the request
    request.end()
}



function updateDevice(deviceId, jwt, latitude, longitude, version) {

    var updateRequestData = {
        latitude: latitude,
        longitude: longitude
        //firmwareVersion: "3"
    };

    var updateRequestDataString = JSON.stringify(updateRequestData);

    //console.log(updateRequestDataString);
    //console.log("Length = " + jwtRequestDataString.length);
    
    var updateOptions = {
        host: "blueprint.xively.com",
        //port: 443,
        path: '/api/v1/devices/' + deviceId,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': updateRequestDataString.length,
            'ETag': version,
            'Authorization': 'Bearer ' + jwt
        },
    };

    //console.log(updateOptions);

    // Set up the request
    var updateRequest = https.request(updateOptions, function(res) {

        var data = "";

        // this event fires many times, each time collecting another piece of the response
        res.on("data", function (chunk) {
            // append this chunk to our growing `data` var
            data += chunk;
        });

        // this event fires *one* time, after all the `data` events/chunks have been gathered
        res.on("end", function () {
            
            //console.log("Response from the Xively Identity API: ");

            if (this.statusCode == 200) {
                console.log("Device location updated successfully");
            }
            else {
                console.log("Device location could not be updated");
            }
            //console.log("Response to update request:");
            //console.log(this.statusCode);
            //console.log(data);

        });

    });

    updateRequest.on('error', (e) => {
        console.error("Error during updating device location: " + e);
    });

    // Send data to the API
    updateRequest.write(updateRequestDataString);

    // End the request
    updateRequest.end();
}