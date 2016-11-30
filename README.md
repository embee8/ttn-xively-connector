# XiLoRa - Connecting Xively and The Things Network
A Node.js application that connects The Things Network and Xively.

## What it does
This application is a MQTT bridge between the TTN and Xively brokers. Given that the two platforms are structured in a slightly different way, the application allows to model a mapping between devices and channels.

## Deployment
Clone the project to run it locally or use the provided Heroku button to deploy it in the cloud.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/embee8/ttn-xively-connector/tree/master)

## Configuration
During the deployment process, the application username and password need to be set. These credentials can but don't have to be the same as the Xively credentials.

All other connection settings (TTN App IDs and access keys, Xively connection paramenters, etc.) are configured within the application.