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

// Getting bodyParser to check the json body.
app.use(bodyParser.json());

// Route for POST requests, getting the information from request body and sending the reply as needed.
app.post('/', (req, res) => {
  // Verifying that all necessary inputs were provided in request body.
  if (!req.body.customer || !req.body.latitude || !req.body.longitude) {
    res.status(400).send('Customer name, latitude, and longitude requred. Please send these in a JSON body using the keys "customer", "latitude", and "longitude".');
    return;
  }
  // Parsing the latitude and longitude are numbers in case they got sent as strings.
  let latitude = parseFloat(req.body.latitude);
  let longitude = parseFloat(req.body.longitude);
  // Making sure the latitude and longitude provided are valid.
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
  // If we were unable to find that customer name in the config file, send an error.
  if (!customerConfig[0]) {
    res.status(400).send('Unable to find information for that customer.');
    return;
  }
  // With all verification completed. Now we get to actually start sending the request. First, we set up the search URL.
  let urlToGet = `https://maps.googleapis.com/maps/api/place/radarsearch/json?location=${latitude},${longitude}&radius=2000&language=${customerConfig[0].language}&type=${customerConfig[0].type}&key=${customerConfig[0].apiKey}`;
  // Now we send the HTTPS request.
  https.get(urlToGet, (getRes) => {
    // Getting the statuscode of the reply, and if it isn't a 200 then passing that forward.
    const { statusCode } = getRes;
    if (statusCode !== 200) {
      res.status(statusCode).send('Error received when sending request.');
      return;
    }

    // If we got a 200, set the encoding and collect the reply data.
    getRes.setEncoding('utf8');
    let rawData = '';
    getRes.on('data', (chunk) => { rawData += chunk; });
    // Once response is complete, try parsing the data.
    getRes.on('end', () => {
      try {
        let replyJSON = JSON.parse(rawData);
        // Verify that the response status received from Google is OK.
        if (replyJSON.status === "OK") {
          // Get the results provided from Google in an array.
          let resultsArray = replyJSON.results;
          // If the array of replies is longer than the request number in customer's config, remove extra items from array.
          if (resultsArray.length > customerConfig[0].requestNumber) {
            resultsArray = resultsArray.slice(0, customerConfig[0].requestNumber);
          }
          // If the customer wants a response in JSON, send the reply in json.
          if (customerConfig[0].responseOutput === 'json') {
            res.status(200).send(resultsArray);
          } else {
            // If the customer doesn't want a response in JSON, parse the data into XML and send that XML to customer.
            let builder = new xml2js.Builder();
            let xmlReply = builder.buildObject(resultsArray);
            res.status(200).set('Content-Type', 'application/xml').send(xmlReply);
          }
        // If the response status received from Google is not 'OK', send an error forward explaining the problem.
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
        // Catching any other errors in response.
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    // Catching any other errors in HTTPS request.
    console.error(`Got error: ${e.message}`);
    res.status(500).send(`Got error: ${e.message}`);
  });
});

app.listen(port, () => {
  console.log('Listening on port ', port);
});

module.exports = app;
