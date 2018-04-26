'use strict';

// Loading up .env file, primarily for API keys.
require('dotenv').load();

// Getting express server and body-parser middleware included.
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

// Setting up HTTPS so we can send out https requests.
const https = require('https');

// XML parsing for the case where customer wants XML reply.
const xml2js = require('xml2js');
const parser = new xml2js.Parser()

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
  // If we were unable to find that customer name in the config file...
  if (!customerConfig[0]) {
    res.status(400).send('Unable to find information for that customer.');
    return;
  }
  // With all verification completed. Now we get to actually start sending the request...
  let urlToGet = `https://maps.googleapis.com/maps/api/place/nearbysearch/${customerConfig[0].responseOutput}?location=${latitude},${longitude}&radius=2000&language=${customerConfig[0].language}&type=${customerConfig[0].type}&key=${customerConfig[0].apiKey}`;

  https.get(urlToGet, (getRes) => {
    let resultsArray;
    const { statusCode } = getRes;
    console.log('statusCode - ', statusCode);

    getRes.setEncoding('utf8');
    let rawData = '';
    getRes.on('data', (chunk) => { rawData += chunk; });
    getRes.on('end', () => {
      try {
        if (customerConfig[0].responseOutput === 'json') {
          const parsedData = JSON.parse(rawData);
          resultsArray = parsedData.results;
          console.log('Here is the results array - ', resultsArray);
        } else {
          parser.parseString(rawData, (err, result) => {
            resultsArray = result.PlaceSearchResponse.result;
          });
          console.log('Here is the results array - ', resultsArray);
        }
      } catch (e) {
        console.error(e.message);
      }
      if (resultsArray.length > customerConfig[0].requestNumber) {
        resultsArray = resultsArray.slice(0, customerConfig[0].requestNumber);
      }
      res.status(200).send(resultsArray);
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });

});

app.listen(port, () => {
  console.log('Listening on port ', port);
});

module.exports = app;
