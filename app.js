'use strict';

require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

const config = require('./config.json');
config.sunriseBank.apiKey = process.env.SUNRISEBANKAPI;
config.happyCreditUnion.apiKey = process.env.HAPPYCREDITUNIONAPI;
config.parisFCU.apiKey = process.env.PARISFCUAPI;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  console.log(req.body);
  if (!req.body.customer || !req.body.latitude || !req.body.longitude) {
    res.status(400);
    res.send('Customer name, latitude, and longitude requred. Please send content ')
  }
});

app.listen(port, () => {
  console.log(config);
  console.log('Listening on port ', port);
});

module.exports = app;
