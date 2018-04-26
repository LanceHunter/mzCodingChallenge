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

// Route for GET requests, getting the information from request body and sending the reply as needed.
app.post('/', (req, res) => {
  console.log('Req.body - ', req.body);
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
  let urlToGet = `https://maps.googleapis.com/maps/api/place/radarsearch/json?location=${latitude},${longitude}&radius=2000&language=${customerConfig[0].language}&type=${customerConfig[0].type}&key=${customerConfig[0].apiKey}`;

  https.get(urlToGet, (getRes) => {
    const { statusCode } = getRes;
    console.log('statusCode - ', statusCode);

    if (statusCode !== 200) {
      res.sendStatus(statusCode);
      return;
    }

    getRes.setEncoding('utf8');
    let rawData = '';
    getRes.on('data', (chunk) => { rawData += chunk; });
    getRes.on('end', () => {
      try {
        let replyJSON = JSON.parse(rawData);
        console.log('replyJSON.status - ', replyJSON.status);
        if (replyJSON.status === "OK") {
          let resultsArray = replyJSON.results;
          if (resultsArray.length > customerConfig[0].requestNumber) {
            resultsArray = resultsArray.slice(0, customerConfig[0].requestNumber);
          }
          if (customerConfig[0].responseOutput === 'json') {
            res.status(200).send(resultsArray);
          } else {
            let builder = new xml2js.Builder();
            let xmlReply = builder.buildObject(resultsArray);
            res.status(200).send(xmlReply);
          }
        } else if (replyJSON.status === 'ZERO_RESULTS') {
          res.status(200).send('No results for this location.');
        } else if (replyJSON.status === 'OVER_QUERY_LIMIT') {
          res.status(400).send('Over query limit.');
        } else if (replyJSON.status === 'REQUEST_DENIED') {
          res.status(400).send('Request was denied.');
        } else if (replyJSON.status === 'INVALID_REQUEST') {
          res.status(400).send('Request is invalid.');
        } else if (replyJSON.status === 'UNKNOWN_ERROR') {
          res.status(500).send('Unknown error received.');
        } else {
          res.status(500).send('Unknown error received.');
        }
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });

});

app.listen(port, () => {
  console.log('Listening on port ', port);
});

module.exports = app;
