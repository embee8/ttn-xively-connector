# XiLoRa - Connecting Xively and The Things Network
A Node.js application that connects The Things Network and Xively.

## What it does
In essence, XiLoRa is a bridge between the TTN and Xively MQTT brokers. Given that the two platforms are structured in a slightly different way, XiLoRa allows you to create your custom mapping between devices and channels.

## Deployment
Use the button below to deploy the application to Heroku. The Postgres add-on that will be installed alongside the Node.js application will be provisioned as a free `hobby-dev` instance [plan info](https://devcenter.heroku.com/articles/heroku-postgres-plans).

You can also clone the project and run it locally with the command `node server.js`, but you need to make sure that the application database is running and accessible.   

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/embee8/ttn-xively-connector/tree/master)

## Configuration
During the deployment process, you will be asked to set an application username and password. You can use your Xively credentials for simplicity reasons, but to keep things safe it is suggested to use an extra set of credentials for XiLoRa only.

All other connection settings (TTN App IDs and access keys, Xively connection parameters, etc.) are configured via the administrator interface.