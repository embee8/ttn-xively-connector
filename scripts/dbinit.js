"use strict";

var pg = require('pg');
var fs = require('fs');
var APP_DATABASE_URL;

try {
    console.log("Reading connection string...");
    var envVars = JSON.parse(fs.readFileSync("config/config.json", "utf8"));
    APP_DATABASE_URL = envVars.APP_DATABASE_URL;
}
catch (e) {
    if (e.code === "ENOENT") {
        console.log("Local config file not found, reading environment variables.");
        APP_DATABASE_URL = process.env.APP_DATABASE_URL;
    }
    else {
        console.log("Error code: " + e.code);
    }
}


try {
    console.log("Reading database script...");

    var sql = fs.readFileSync('database/tables.sql').toString();
    
    pg.connect(APP_DATABASE_URL, function (err, client, done) {
        if (err) {
            console.log('error: ', err);
            process.exit(1);
        }
        
        console.log("Running database script...");
        
        client.query(sql, function(err, result) {
            done();
            if(err){
                console.log('Error: ', err);
                process.exit(1);
            }
            console.log("Database initialised!");
            process.exit(0);
        });
    });
}
catch (e) {
    console.log("Couldn't find or read database script.");
}

