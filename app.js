'use strict';

// Loading up .env file, primarily for API keys.
require('dotenv').load();

// Getting express server and body-parser middleware included.
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

// Loading the customer configuration from its json file into a local object and adding the api keys each .
const config = require('./config.json');
config[0].apiKey = process.env.SUNRISEBANKAPI;
config[1].apiKey = process.env.HAPPYCREDITUNIONAPI;
config[2].apiKey = process.env.PARISFCUAPI;

// Getting bodyParser running.
app.use(bodyParser.json());

// Route for POST requests, getting the information from request body and
app.post('/', (req, res) => {
  if (!req.body.customer || !req.body.latitude || !req.body.longitude) {
    res.status(400).send('Customer name, latitude, and longitude requred. Please send these in the URL of the request using the keys "customer", "latitude", and "longitude".');
    return;
  }
  let latitude = parseFloat(req.body.latitude);
  let longitude = parseFloat(req.body.longitude);
  if (latitude > 90 || latitude < -90 || isNaN(latitude)) {
    res.status(400).send('Latitude is not valid.');
    return;
  }
  if (longitude > 180 || longitude < -180 || isNaN(longitude)) {
    res.status(400).send('Longitude is not valid.');
    return;
  }
  // Getting the correct config from the array of customer configurations based on the name entered.
  let customerConfig = config.filter((customer) => {
    return customer.name.toUpperCase() === req.body.customer.toUpperCase();
  });
  //
  if (!customerConfig[0]) {
    res.status(400).send('Customer name is not valid.');
    return;
  }
});

app.listen(port, () => {
  console.log('Listening on port ', port);
});

module.exports = app;
