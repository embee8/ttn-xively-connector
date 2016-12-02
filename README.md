# XiLoRa - Connecting Xively and The Things Network
XiLora is an experimental application that connects The Things Network and Xively.  The application is written in Node.js.

## What it does
XiLoRa is a bridge between the The Things Network and the Xively Connected Product Management service ([Trial Account Setup](https://xively.com)). It links the upward communication between a given LoRaWAN application and a Xively device template and matching device instances. Each LoRaWAN device is mapped to a Xively device. All data passed in the payload of a LoRaWAN application is mapped to channels defined in a Xively template. The geographical location of the closest TTN gateway is also mapped automatically to the device's longitude, lattitude meta data fields.

## Deployment
Use the button below to deploy the application to a new Heroku instance. The Postgres add-on that will be installed alongside the Node.js application will be provisioned as a free `hobby-dev` instance [plan info](https://devcenter.heroku.com/articles/heroku-postgres-plans).  

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/embee8/ttn-xively-connector/tree/master)

You can also clone the project and run it locally with the command `node server.js`, but you need to make sure that the application database is set up and accessible. For local installations, the database provisioning scripts in the `database` folder will be helpful. 

## Configuration
During the deployment process, you will be asked to set an application username and password.  These credentials are used to access the web interface of the application which is used purely for administration purposes. These credentials can be later changed by modifying the environment variables.

All connection settings (TTN App IDs and access keys, Xively connection parameters, etc.) are configured through the administrator interface at the URL of this application.

A detailed summary and setup guide can be found in the [Wiki](https://github.com/embee8/ttn-xively-connector/wiki).