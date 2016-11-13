# The Things Network - Xively Connector
A Node.js application that connects The Things Network and Xively.

## What it does
This application is a MQTT bridge between the TTN and Xively brokers. Given that the two brokers are structured in a slightly different way, the mapping between devices needs to be analysed and adjusted as needed to make sure that every message reaches the right device.

## Deployment
Clone the project to run it locally or use the provided Heroku button to deploy it to a new cloud instance.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/embee8/ttn-xively-connector/tree/master)

## Configuration
Once you have deployed the app, use the provided environment variables to configure the connections to The Things Network and Xively.